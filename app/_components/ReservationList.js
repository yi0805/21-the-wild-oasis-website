"use client";

import { useOptimistic } from "react";

import ReservationCard from "@/app/_components/ReservationCard";
import { deleteReservationAction } from "@/app/_lib/actions";

function ReservationList({ bookings }) {
  const [optimisticBookings, optimisticDelete] = useOptimistic(
    bookings,
    (curBookings, bookingid) => {
      return curBookings.filter((booking) => booking.id !== bookingid);
    },
  );

  async function handleDelete(bookingid) {
    optimisticDelete(bookingid);
    await deleteReservationAction(bookingid);
  }

  return (
    <ul className="space-y-6">
      {optimisticBookings.map((booking) => (
        <ReservationCard
          booking={booking}
          key={booking.id}
          onDelete={handleDelete}
        />
      ))}
    </ul>
  );
}

export default ReservationList;
