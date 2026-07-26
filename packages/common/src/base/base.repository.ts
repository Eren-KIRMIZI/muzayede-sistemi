/**
 * Generic repository interface.
 * Concrete implementations wrap PrismaService.
 */
export interface IRepository<T, CreateDto, UpdateDto = Partial<CreateDto>> {
  findById(id: string): Promise<T | null>
  findAll(options?: { skip?: number; take?: number }): Promise<T[]>
  create(data: CreateDto): Promise<T>
  update(id: string, data: UpdateDto): Promise<T>
  delete(id: string): Promise<void>
  count(where?: Record<string, unknown>): Promise<number>
}
