/**
 * Service — Represents a service offered (e.g. Haircut, Consultation).
 *
 * SRP: Only manages service configuration data.
 */
export class Service {
  public id: number;
  public name: string;
  public description: string | null;
  public estimatedDurationMinutes: number;
  public isActive: boolean;
  public staffId: number | null;
  public createdAt: string;
  public updatedAt: string;

  constructor(data: Partial<Service> & { name: string; estimatedDurationMinutes: number }) {
    this.id = data.id ?? 0;
    this.name = data.name;
    this.description = data.description ?? null;
    this.estimatedDurationMinutes = data.estimatedDurationMinutes;
    this.isActive = data.isActive ?? true;
    this.staffId = data.staffId ?? null;
    this.createdAt = data.createdAt ?? new Date().toISOString();
    this.updatedAt = data.updatedAt ?? new Date().toISOString();
  }
}
