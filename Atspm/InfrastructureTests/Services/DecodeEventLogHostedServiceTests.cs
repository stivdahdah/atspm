// Copyright 2026 Utah Department of Transportation
// Licensed under the Apache License, Version 2.0.
// See http://www.apache.org/licenses/LICENSE-2.0 for the license.

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Utah.Udot.Atspm.Data.Models;
using Utah.Udot.Atspm.Data.Models.EventLogModels;
using Utah.Udot.Atspm.Infrastructure.Configuration;
using Utah.Udot.Atspm.Infrastructure.Services.EventLogDecoders;
using Utah.Udot.Atspm.Infrastructure.Services.EventLogImporters;
using Utah.Udot.Atspm.Infrastructure.Services.HostedServices;
using Utah.Udot.Atspm.Repositories.ConfigurationRepositories;
using Utah.Udot.Atspm.Repositories.EventLogRepositories;
using Utah.Udot.Atspm.Services;
using Xunit;

namespace Utah.Udot.Atspm.InfrastructureTests.Services;

public class DecodeEventLogHostedServiceTests
{
    [Fact]
    public async Task ImportsSmallXmlFilesAndCompletesTheArchiveWorkflow()
    {
        var path = Path.Combine(Path.GetTempPath(), "atspm-decode-" + Guid.NewGuid().ToString("N"));
        var directory = Directory.CreateDirectory(Path.Combine(path, "synthetic-127.0.0.1"));
        var file = Path.Combine(directory.FullName, "events.xml");
        await File.WriteAllTextAsync(file, """
            <EventResponses><EventResponse>
              <Event TimeStamp="2024-06-23T08:00:00" EventTypeID="1" Parameter="2" />
              <Event TimeStamp="2024-06-23T08:00:25" EventTypeID="4" Parameter="2" />
            </EventResponse></EventResponses>
            """);
        try
        {
            var device = new Device
            {
                Id = 7,
                DeviceIdentifier = "synthetic",
                Location = new Location { LocationIdentifier = "test-location" },
                DeviceConfiguration = new DeviceConfiguration { Decoders = [nameof(MaxtimeToIndianaDecoder)] }
            };
            var devices = new Mock<IDeviceRepository>();
            devices.Setup(repository => repository.GetList()).Returns(new[] { device }.AsQueryable());
            var saved = new List<CompressedEventLogBase>();
            var events = new Mock<IEventLogRepository>();
            events.Setup(repository => repository.LookupAsync(It.IsAny<CompressedEventLogBase>()))
                .ReturnsAsync((CompressedEventLogBase)null);
            events.Setup(repository => repository.AddAsync(It.IsAny<CompressedEventLogBase>()))
                .Callback<CompressedEventLogBase>(saved.Add).Returns(Task.CompletedTask);
            var importerOptions = new Mock<IOptionsSnapshot<EventLogImporterConfiguration>>();
            importerOptions.Setup(options => options.Get(It.IsAny<string>()))
                .Returns(new EventLogImporterConfiguration { EarliestAcceptableDate = new DateTime(1980, 1, 1), DeleteSource = false });
            var services = new ServiceCollection();
            services.AddSingleton(devices.Object);
            services.AddSingleton(events.Object);
            services.AddScoped<IEventLogImporter>(_ => new EventLogFileImporter(
                [new MaxtimeToIndianaDecoder()], NullLogger<IEventLogImporter>.Instance, importerOptions.Object));
            await using var provider = services.BuildServiceProvider();
            using var scope = provider.CreateScope();
            var service = new DecodeEventLogHostedService(NullLogger<DecodeEventLogHostedService>.Instance,
                provider.GetRequiredService<IServiceScopeFactory>(), Options.Create(new DecodeEventsConfiguration { Path = path }));

            await service.Process(scope, new Stopwatch()).WaitAsync(TimeSpan.FromSeconds(10));

            var batch = Assert.Single(saved);
            Assert.Equal("test-location", batch.LocationIdentifier);
            var decoded = batch.Data.Cast<IndianaEvent>().OrderBy(item => item.Timestamp).ToList();
            Assert.Equal(new short[] { 1, 4 }, decoded.Select(item => item.EventCode));
            Assert.All(decoded, item => Assert.Equal("test-location", item.LocationIdentifier));
            Assert.True(File.Exists(file));
        }
        finally
        {
            Directory.Delete(path, recursive: true);
        }
    }
}
