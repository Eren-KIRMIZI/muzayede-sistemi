/**
 * Base entity fields shared by all Prisma models.
 * Use this as a type reference — actual Prisma models don't extend classes.
 */
export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

export interface SoftDeletableEntity extends BaseEntity {
  deletedAt: Date | null
  isDeleted: boolean
}
