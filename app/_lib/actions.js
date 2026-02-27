"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth, signIn, signOut } from "@/app/_lib/auth";
import {
  createBooking,
  deleteBooking,
  getBookings,
  updateBooking,
  updateGuest,
} from "@/app/_lib/data-service";

export async function signInAction() {
  await signIn("google", { redirectTo: "/account" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function updateProfileAction(formData) {
  const session = await auth();

  if (!session) {
    throw new Error("You must be logged in");
  }

  const nationalID = formData.get("nationalID");
  const [nationality, countryFlag] = formData.get("nationality").split("%");

  if (!/^[a-zA-Z0-9]{6,12}$/.test(nationalID)) {
    throw new Error("Please provide a valid national ID");
  }

  const updatedGuest = {
    nationalID,
    nationality,
    countryFlag,
  };

  await updateGuest(session.user.guestId, updatedGuest);
  revalidatePath("/account/profile");
}

export async function deleteReservationAction(bookingId) {
  const session = await auth();
  if (!session) {
    throw new Error("You must be logged in");
  }

  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingIds = guestBookings.map((booking) => booking.id);
  if (!guestBookingIds.includes(bookingId)) {
    throw new Error("You are not allowed to delete this booking");
  }

  await deleteBooking(bookingId);
  revalidatePath("/account/reservations");
}

export async function updateReservationAction(formData) {
  const session = await auth();
  if (!session) {
    throw new Error("You must be logged in");
  }

  const updateData = {
    numGuests: Number(formData.get("numGuests")),
    observations: formData.get("observations").slice(0, 1000),
  };

  const bookingid = Number(formData.get("bookingid"));

  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingIds = guestBookings.map((booking) => booking.id);
  if (!guestBookingIds.includes(bookingid)) {
    throw new Error("You are not allowed to update this booking");
  }

  await updateBooking(bookingid, updateData);
  revalidatePath("/account/reservations");
  revalidatePath(`/account/reservations/edit/${bookingid}`);
  redirect("/account/reservations");
}

export async function createReservationAction(bookingData, formData) {
  const session = await auth();
  if (!session) {
    throw new Error("You must be logged in");
  }

  const newBooking = {
    ...bookingData,
    guestId: session.user.guestId,
    numGuests: Number(formData.get("numGuests")),
    observations: formData.get("observations").slice(0, 1000),
    extrasPrice: 0,
    totalPrice: bookingData.cabinPrice,
    isPaid: false,
    hasBreakfast: false,
    status: "unconfirmed",
  };

  await createBooking(newBooking);

  revalidatePath(`/cabins/${bookingData.cabinId}`);
  redirect("/cabins/thankyou");
}
