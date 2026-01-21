import { eventHandler } from 'h3'

import prisma from '../../../db'
import { requireSuperAdmin } from '../../../utils/superadmin-session'

export default eventHandler(async (event) => {
  await requireSuperAdmin(event, { roles: ['OWNER', 'MANAGER'] })

  // @ts-expect-error Prisma client will be regenerated after migration
  const content = await prisma.storefrontContent.findUnique({
    where: { key: 'home' },
    select: {
      id: true,
      key: true,
      data: true,
      updatedAt: true
    }
  })

  return {
    content
  }
})
