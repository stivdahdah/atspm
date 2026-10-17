import AdminTable from '@/components/AdminTable/AdminTable'
import DeleteModal from '@/components/AdminTable/DeleteModal'
import { ResponsivePageLayout } from '@/components/ResponsivePage'
import { useDeleteUser } from '@/features/identity/api/deleteUser'
import { useGetAllUsers } from '@/features/identity/api/getAllUsers'
import { UserAssignmentCell } from '@/features/identity/components/users/UserAssignmentCell'
import UserModal from '@/features/identity/components/users/UserModal'
import { UserRolesCell } from '@/features/identity/components/users/UserRolesCell'
import {
  PageNames,
  useUserHasClaim,
  useViewPage,
} from '@/features/identity/pagesCheck'
import UserDto from '@/features/identity/types/userDto'
import { identityRequest } from '@/lib/axios'
import { useNotificationStore } from '@/stores/notifications'
import { Backdrop, CircularProgress } from '@mui/material'

const UsersAdmin = () => {
  const pageAccess = useViewPage(PageNames.Users)
  const hasUserEditClaim = useUserHasClaim('User:Edit')
  const hasUserDeleteClaim = useUserHasClaim('User:Delete')

  const { addNotification } = useNotificationStore()

  const { mutateAsync: deleteMutation } = useDeleteUser()
  const {
    data: allUserData,
    isLoading: usersIsLoading,
    refetch: refetchUsers,
  } = useGetAllUsers()

  const users = allUserData

  const normalizeIds = (values: unknown) =>
    Array.isArray(values)
      ? values
          .map((value) => Number(value))
          .filter((value) => !Number.isNaN(value))
      : []

  const handleEditUser = async (
    userData: Parameters<React.ComponentProps<typeof UserModal>['onSave']>[0]
  ) => {
    const {
      userId,
      firstName,
      lastName,
      agency,
      userName,
      email,
      roles,
      areaIds,
      regionIds,
      jurisdictionIds,
    } = userData
    try {
      await identityRequest({
        url: '/Users/update',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: {
          userId,
          firstName,
          lastName,
          agency,
          email: email.toLowerCase(),
          userName: userName.toLowerCase(),
          roles,
          areaIds: normalizeIds(areaIds),
          regionIds: normalizeIds(regionIds),
          jurisdictionIds: normalizeIds(jurisdictionIds),
        },
      })
      addNotification({
        title: `User updated successfully.`,
        type: 'success',
      })
      refetchUsers()
    } catch (error) {
      console.error('Mutation Error:', error)
      addNotification({
        title: `Error updating user: ${error instanceof Error ? error.message : 'Request failed'}`,
        type: 'error',
      })
    }
  }

  const handleDeleteUser = async (id: string | number) => {
    try {
      await deleteMutation(id)
      addNotification({
        title: `User deleted successfully.`,
        type: 'success',
      })
      refetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      addNotification({
        title: `Error deleting user: ${error instanceof Error ? error.message : 'Request failed'}`,
        type: 'error',
      })
    }
  }

  if (pageAccess.isLoading) {
    return
  }

  const filteredData = users?.map((user) => {
    return {
      ...user,
      id: user.userId,
      name: user.fullName,
      roles: [...(user.roles ?? [])].sort(),
    }
  })

  const cells = [
    {
      key: 'fullName',
      label: 'Full Name',
    },
    {
      key: 'userName',
      label: 'Username',
    },
    {
      key: 'email',
      label: 'Email',
    },
    {
      key: 'agency',
      label: 'Agency',
    },
    {
      key: 'roles',
      label: 'Roles',
      component: UserRolesCell,
    },
    {
      key: 'regions',
      label: 'Regions',
      component: UserAssignmentCell,
    },
    {
      key: 'jurisdictions',
      label: 'Jurisdictions',
      component: UserAssignmentCell,
    },
    {
      key: 'areas',
      label: 'Areas',
      component: UserAssignmentCell,
    },
  ]

  if (usersIsLoading) {
    return (
      <Backdrop open>
        <CircularProgress color="inherit" />
      </Backdrop>
    )
  }

  if (!allUserData) {
    return <div>Error returning data</div>
  }

  return (
    <ResponsivePageLayout title="Manage Users" noBottomMargin>
      <AdminTable
        pageName="User"
        cells={cells}
        data={filteredData}
        hasEditPrivileges={hasUserEditClaim}
        hasDeletePrivileges={hasUserDeleteClaim}
        hideAuditProperties
        editModal={
          <UserModal
            isOpen={true}
            onSave={handleEditUser}
            data={null}
            onClose={() => undefined}
          />
        }
        deleteModal={
          <DeleteModal
            id={0}
            name={''}
            deleteByKey="userId"
            objectType="User"
            deleteLabel={(selectedRow: UserDto) => selectedRow.fullName}
            open={false}
            onClose={() => undefined}
            onConfirm={handleDeleteUser}
          />
        }
      />
    </ResponsivePageLayout>
  )
}

export default UsersAdmin
