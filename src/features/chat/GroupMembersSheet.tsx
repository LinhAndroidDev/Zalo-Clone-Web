import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { UserAvatar } from '@/components/UserAvatar'
import { groupChatRepository } from '@/data/repositories/groupChatRepository'
import { useFriendsQuery } from '@/hooks/useFriendsQuery'
import type { GroupChat, User } from '@/domain/models'
import { useSessionStore } from '@/stores/sessionStore'

export function GroupMembersSheet({
  open,
  onOpenChange,
  group,
  members,
  me,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: GroupChat | undefined
  members: User[]
  me: User | undefined
}) {
  const userId = useSessionStore((s) => s.userId)
  const { data: friends = [] } = useFriendsQuery()
  const queryClient = useQueryClient()
  const isCreator = group?.createdBy === userId

  const add = useMutation({
    mutationFn: async (friend: { keyAuth: string; name: string; avatar: string }) => {
      if (!group || !me) return
      await groupChatRepository.addGroupMembers(
        group.groupId,
        [friend.keyAuth],
        me,
        { [friend.keyAuth]: { name: friend.name, avatar: friend.avatar } },
      )
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['group-members'] })
    },
    onError: () => toast.error('Không thêm được thành viên'),
  })

  const remove = useMutation({
    mutationFn: async (member: User) => {
      if (!group || !me) return
      await groupChatRepository.removeGroupMember(
        group.groupId,
        member.userId,
        me,
        member.name,
      )
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['group-members'] })
    },
    onError: () => toast.error('Chỉ trưởng nhóm mới được xóa thành viên'),
  })

  const leave = useMutation({
    mutationFn: async () => {
      if (!group || !me) return
      await groupChatRepository.leaveGroup(group.groupId, me)
    },
    onSuccess: () => onOpenChange(false),
    onError: () => toast.error('Không rời nhóm được'),
  })

  const memberIds = new Set(group?.memberIds ?? [])
  const candidates = friends.filter((f) => !memberIds.has(f.keyAuth))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Thành viên ({members.length})</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-2 px-4 pb-4">
          {members.map((member) => (
            <div key={member.userId} className="flex items-center gap-2">
              <UserAvatar name={member.name} src={member.avatar} className="size-9" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{member.name}</p>
                {member.userId === group?.createdBy ? (
                  <p className="text-xs text-muted-foreground">Trưởng nhóm</p>
                ) : null}
              </div>
              {isCreator && member.userId !== userId ? (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => remove.mutate(member)}
                >
                  Xóa
                </Button>
              ) : null}
            </div>
          ))}
          {candidates.length > 0 && isCreator ? (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium">Thêm bạn</p>
              {candidates.map((f) => (
                <div key={f.keyAuth} className="flex items-center gap-2 py-1">
                  <UserAvatar name={f.name} src={f.avatar} className="size-8" />
                  <p className="flex-1 truncate text-sm">{f.name}</p>
                  <Button size="xs" onClick={() => add.mutate(f)}>
                    Thêm
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
          <Button
            variant="destructive"
            className="mt-4"
            onClick={() => leave.mutate()}
            disabled={leave.isPending}
          >
            Rời nhóm
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
