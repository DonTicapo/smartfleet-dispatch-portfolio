import type { DispatchBoardEntry } from '../../domain/entities/dispatch-board-entry.js';
import type { DispatchBoardRepository } from '../../infrastructure/repositories/dispatch-board-repository.js';
import type { OtlCoreClient } from '../../infrastructure/otl-core/otl-core-client.js';
import type { AssignmentRepository } from '../../infrastructure/repositories/assignment-repository.js';

export class DispatchBoardService {
  constructor(
    private boardRepo: DispatchBoardRepository,
    private assignmentRepo: AssignmentRepository,
    private otlCoreClient: OtlCoreClient,
  ) {}

  async getBoard(date: string): Promise<DispatchBoardEntry[]> {
    return this.boardRepo.findByDate(date);
  }

  async refresh(date: string): Promise<{ refreshed: number }> {
    // In full implementation, this calls OTL core to get tickets/loads for the date
    // and upserts them into the board table enriched with local truck/driver data.
    // For now, return 0 until OTL core exposes the query endpoint.
    await this.otlCoreClient.listTicketsByDate(date);
    // TODO: Map tickets -> board entries with local truck/driver enrichment
    return { refreshed: 0 };
  }
}
