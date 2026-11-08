import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Tag } from '../database/entities/tag.entity.js';
import { CreateTagDto, UpdateTagDto } from './dto/tag.dto.js';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  async findAll(query: { page?: number; limit?: number; search?: string } = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    const qb = this.tagRepository
      .createQueryBuilder('tag')
      .orderBy('tag.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.search) {
      qb.where('tag.name ILIKE :search', { search: `%${query.search}%` });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAllForPublic(): Promise<Tag[]> {
    return this.tagRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException('Tag no encontrado');
    }
    return tag;
  }

  async create(dto: CreateTagDto): Promise<Tag> {
    const existing = await this.tagRepository.findOne({
      where: [{ name: dto.name }, { slug: dto.slug }],
    });
    if (existing) {
      throw new ConflictException('Ya existe un tag con ese nombre o slug');
    }
    const tag = this.tagRepository.create(dto);
    return this.tagRepository.save(tag);
  }

  async update(id: string, dto: UpdateTagDto): Promise<Tag> {
    const tag = await this.findOne(id);
    if (dto.name || dto.slug) {
      const conflict = await this.tagRepository.findOne({
        where: [
          ...(dto.name ? [{ name: dto.name }] : []),
          ...(dto.slug ? [{ slug: dto.slug }] : []),
        ],
      });
      if (conflict && conflict.id !== id) {
        throw new ConflictException('Ya existe un tag con ese nombre o slug');
      }
    }
    Object.assign(tag, dto);
    return this.tagRepository.save(tag);
  }

  async remove(id: string): Promise<void> {
    const tag = await this.findOne(id);
    await this.tagRepository.delete(tag.id);
  }
}
