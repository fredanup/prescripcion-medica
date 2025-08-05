import { useState, useCallback, useEffect, useRef } from 'react';
import Script from 'next/script';
import Spinner from 'utilities/spinner';
import { PaymentRequestBody } from 'utils/auth';

declare global {
  interface Window {
    MercadoPago: new (publicKey: string) => {
      bricks(): {
        create(
          type: string,
          containerId: string,
          settings: Record<string, unknown>,
        ): Promise<any>;
      };
    };
  }
}

export default function PaymentModal({
  totalAmount,
  onClose,
  onSuccess,
}: {
  totalAmount: number;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [brickController, setBrickController] = useState<any>(null);

  // Generar un ID único para cada instancia del modal
  const containerId = useRef(
    `cardPaymentBrick_container_${Date.now()}_${Math.random()}`,
  );
  const isInitialized = useRef(false);
  const isMounted = useRef(true);

  const createMPFormContainer = useCallback(async () => {
    if (isInitialized.current || !isMounted.current) return;

    try {
      const publicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_SAMPLE_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error('Error de configuración: Falta la clave pública.');
      }

      // Esperar un poco más para asegurar que el DOM esté listo
      await new Promise((resolve) => setTimeout(resolve, 200));

      if (!isMounted.current) return;

      const mp = new window.MercadoPago(publicKey);

      // Limpiar completamente el contenedor
      const container = document.getElementById(containerId.current);
      if (container) {
        container.innerHTML = '';
        // Forzar reflow del DOM
        container.offsetHeight;
      }

      const settings = {
        locale: 'es-PE',
        initialization: { amount: totalAmount },
        callbacks: {
          onReady: () => {
            if (isMounted.current) {
              setIsLoading(false);
            }
          },
          onSubmit: async (cardFormData: PaymentRequestBody) => {
            try {
              const res = await fetch('/api/pago', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  token: cardFormData.token,
                  installments: cardFormData.installments,
                  issuer_id: cardFormData.issuer_id,
                  payment_method_id: cardFormData.payment_method_id,
                  payer: {
                    email: cardFormData.payer.email,
                    identification: {
                      number: cardFormData.payer.identification.number,
                      type: cardFormData.payer.identification.type,
                    },
                  },
                  transactionAmount: Number(totalAmount),
                  description: 'Pago de cita médica',
                }),
              });

              const data = await res.json();
              if (data.error) {
                throw new Error(data.details ?? 'Error en el pago.');
              }

              if (isMounted.current) {
                setSuccessMessage(`Pago exitoso. ID: ${data.id}`);
                onSuccess?.();
                setTimeout(() => {
                  if (isMounted.current) {
                    handleClose();
                  }
                }, 1500);
              }

              return data;
            } catch (error) {
              console.error('Error al procesar la solicitud:', error);
              if (isMounted.current) {
                setErrorMessage(
                  error instanceof Error
                    ? error.message
                    : 'Ocurrió un error inesperado.',
                );
              }
              throw error;
            }
          },
          onError: () => {
            if (isMounted.current) {
              setErrorMessage('Hubo un error en el formulario de pago.');
            }
          },
        },
        customization: { paymentMethods: { maxInstallments: 12 } },
      };

      const controller = await mp
        .bricks()
        .create('cardPayment', containerId.current, settings);

      if (isMounted.current) {
        setBrickController(controller);
        isInitialized.current = true;
      } else {
        // Si el componente se desmontó mientras se creaba, limpiamos
        controller.unmount();
      }
    } catch (err) {
      console.error('Error creando el brick:', err);
      if (isMounted.current) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Error inicializando el pago.',
        );
        setIsLoading(false);
      }
    }
  }, [totalAmount, onSuccess]);

  useEffect(() => {
    isMounted.current = true;
    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const waitForMP = () =>
      new Promise<void>((resolve) => {
        const check = () => {
          if (window.MercadoPago && isMounted.current) {
            resolve();
          } else if (isMounted.current) {
            setTimeout(check, 50);
          }
        };
        check();
      });

    const timer = setTimeout(() => {
      if (isMounted.current) {
        waitForMP().then(createMPFormContainer);
      }
    }, 300); // Aumentamos el delay inicial

    return () => {
      isMounted.current = false;
      clearTimeout(timer);

      if (brickController) {
        try {
          brickController.unmount();
        } catch (error) {
          console.error('Error al limpiar brick:', error);
        }
      }

      // Limpiar el contenedor del DOM
      const container = document.getElementById(containerId.current);
      if (container) {
        container.innerHTML = '';
      }

      isInitialized.current = false;
    };
  }, []); // Sin dependencias

  const handleClose = async () => {
    isMounted.current = false;

    try {
      if (brickController) {
        await brickController.unmount();
        setBrickController(null);
      }
    } catch (error) {
      console.error('Error al desmontar brick:', error);
    }

    // Limpiar completamente el estado
    const container = document.getElementById(containerId.current);
    if (container) {
      container.innerHTML = '';
    }

    isInitialized.current = false;

    onClose();
  };

  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform z-30 h-5/6 w-11/12 overflow-auto rounded-lg bg-white p-6">
      <Script
        src="https://sdk.mercadopago.com/js/v2"
        strategy="afterInteractive"
      />
      {isLoading && <Spinner text="Cargando" />}
      {successMessage && <div className="text-green-600">{successMessage}</div>}
      {errorMessage && <div className="text-red-600">{errorMessage}</div>}
      <div id={containerId.current}></div>
      <div className="pt-2 flex flex-row justify-end gap-2 border-t border-gray-200">
        <button
          type="button"
          className="rounded-lg border bg-gray-500 px-4 py-1 text-base font-medium text-white"
          onClick={handleClose}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
