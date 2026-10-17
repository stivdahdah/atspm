This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

Use **Node.js 24.22.0 LTS** for local development. The version is recorded in
`.nvmrc` and used by every stage of the Dockerfile. With `nvm` on Linux/macOS,
run `nvm install` and `nvm use` from this directory; otherwise install that version
from [Node.js](https://nodejs.org/en/download). Docker installations do not need
Node.js on the host; follow the [installation guide](../README.md).

Install the locked dependencies, then run the development server:

```bash
npm ci
npm run dev
```

Use `npm test -- --runInBand` and `npm run build` to check changes. Keep
`package-lock.json` committed with dependency changes. When updating Node,
update `.nvmrc`, the Dockerfile, and the `package.json` engine range together,
and validate the new LTS patch before publishing an image.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
