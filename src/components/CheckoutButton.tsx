"use client";

import { CreditCard } from "lucide-react";
import { Button } from "./ui/Button";
import { FC } from "react";

interface CheckoutButtonProps {
    priceId: string,
  }

const CheckoutButton: FC<CheckoutButtonProps> = ({ priceId }) => {

  const handleCheckout = async () => {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ priceId }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Missing checkout session URL');
      }
    } catch (error) {
      console.error(error);
      // Aquí podrías mostrar un mensaje de error al usuario
    }
  };

  return (
    <Button className='bg-red-600 text-white hover:bg-red-700' size="lg"
    onClick={handleCheckout}
    >
        Suscribirse
        <CreditCard className='ml-2 h-5 w-5' />
    </Button>
  );
}

export default CheckoutButton;