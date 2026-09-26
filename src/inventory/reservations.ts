export type Reservation = {
  id: string;
  sku: string;
  quantity: number;
};

export class Inventory {
  private stock = new Map<string, number>();
  private reservations = new Map<string, Reservation>();

  setStock(sku: string, quantity: number): void {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new Error("Stock must be a non-negative integer");
    }

    this.stock.set(sku, quantity);
  }

  available(sku: string): number {
    return this.stock.get(sku) ?? 0;
  }

  reserve(reservation: Reservation): void {
    if (this.reservations.has(reservation.id)) {
      throw new Error("Reservation already exists");
    }

    if (!Number.isInteger(reservation.quantity) || reservation.quantity <= 0) {
      throw new Error("Reservation quantity must be a positive integer");
    }

    const available = this.available(reservation.sku);

    if (available < reservation.quantity) {
      throw new Error("Insufficient stock");
    }

    this.stock.set(
      reservation.sku,
      available - reservation.quantity,
    );

    this.reservations.set(reservation.id, reservation);
  }

  release(reservationId: string): void {
    const reservation = this.reservations.get(reservationId);

    if (!reservation) {
      return;
    }

    this.stock.set(
      reservation.sku,
      this.available(reservation.sku) + reservation.quantity,
    );

    this.reservations.delete(reservationId);
  }
}
