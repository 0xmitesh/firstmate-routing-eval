export type Reservation = {
  id: string;
  sku: string;
  quantity: number;
};

export type ReservationState = "active" | "committed" | "released";

export type ReservationRecord = Reservation & {
  state: ReservationState;
};

export class Inventory {
  private stock = new Map<string, number>();
  private reservations = new Map<string, ReservationRecord>();

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

    this.stock.set(reservation.sku, available - reservation.quantity);
    this.reservations.set(reservation.id, { ...reservation, state: "active" });
  }

  getReservation(reservationId: string): ReservationRecord | undefined {
    const reservation = this.reservations.get(reservationId);
    return reservation ? { ...reservation } : undefined;
  }

  release(reservationId: string): void {
    const reservation = this.reservations.get(reservationId);

    // Keep the original no-op behavior for unknown reservation IDs.
    if (!reservation) {
      return;
    }

    if (reservation.state === "released") {
      return;
    }

    if (reservation.state === "committed") {
      throw new Error("Cannot release a committed reservation");
    }

    this.stock.set(
      reservation.sku,
      this.available(reservation.sku) + reservation.quantity,
    );
    reservation.state = "released";
  }

  commit(reservationId: string): void {
    const reservation = this.reservations.get(reservationId);

    if (!reservation) {
      throw new Error(`Cannot commit unknown reservation: ${reservationId}`);
    }

    if (reservation.state !== "active") {
      throw new Error(
        `Cannot commit reservation in ${reservation.state} state`,
      );
    }

    // The stock was deducted on reserve; committing only makes that deduction permanent.
    reservation.state = "committed";
  }
}
