import { auth } from "@clerk/nextjs";
import { db } from "@/lib/prisma";

export const checkUser = async () => {
  const { userId } = auth();

  if (!userId) {
    return null;
  }

  try {
    const loggedInUser = await db?.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (loggedInUser) {
      return loggedInUser;
    }

    // Get user data from Clerk
    const response = await fetch(`${process.env.NEXT_PUBLIC_CLERK_FRONTEND_API}/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    });
    
    const user = await response.json();
    const name = `${user.first_name} ${user.last_name}`;

    const newUser = await db.user.create({
      data: {
        clerkUserId: userId,
        name,
        imageUrl: user.image_url,
        email: user.email_addresses[0].email_address,
      },
    });

    return newUser;
  } catch (error) {
    console.log(error);
    return null;
  }
};