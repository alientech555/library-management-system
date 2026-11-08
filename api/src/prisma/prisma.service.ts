import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService
 * 
 * This class acts as a thin, injectable wrapper around the Prisma Client.
 * By extending PrismaClient, it inherits all generated query methods (e.g., prisma.book.findMany).
 * By implementing Nest's lifecycle hooks, it ensures the database connection is 
 * established before the app accepts traffic, and cleanly severed on shutdown.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  /**
   * onModuleInit
   * Triggered automatically by NestJS once the module is fully initialized.
   * We use this to explicitly open the database connection, preventing race 
   * conditions where a controller might query the DB before Prisma is ready.
   */
  async onModuleInit() {
    await this.$connect();
    this.logger.log('✅ PostgreSQL connection established via Prisma.');
  }

  /**
   * onModuleDestroy
   * Triggered when the application is shutting down.
   * Ensures all pending queries finish and the connection pool is closed gracefully,
   * preventing hanging processes or "too many connections" errors on redeploy.
   */
  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🔌 PostgreSQL connection closed gracefully.');
  }
}