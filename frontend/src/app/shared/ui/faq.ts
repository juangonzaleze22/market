import { Component, signal } from '@angular/core';

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq',
  styles: [`
    .faq-body {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.3s ease, padding 0.3s ease;
      padding: 0 20px;
    }
    .faq-body.open {
      grid-template-rows: 1fr;
      padding: 0 20px 16px;
    }
    .faq-body > div {
      overflow: hidden;
    }
  `],
  template: `
    <section class="container-max py-3xl" data-testid="faq-section">
      <div class="text-center mb-xl">
        <p class="text-body-sm text-body mb-sm">Help & Questions</p>
        <h2 class="text-display-md font-bold">
          Preguntas <span class="text-primary">Frecuentes</span>
        </h2>
      </div>

      <div class="max-w-[48rem] mx-auto space-y-md">
        @for (item of faqs; track item.question; let i = $index) {
          <div
            class="border border-surface-pressed rounded-xl overflow-hidden transition-colors"
            [class.bg-primary]="openIndex() === i"
            [class.text-white]="openIndex() === i"
            [class.bg-white]="openIndex() !== i"
          >
            <button
              type="button"
              class="w-full flex items-center justify-between px-xl py-lg text-left font-medium transition-colors"
              [class.text-white]="openIndex() === i"
              [class.text-ink]="openIndex() !== i"
              (click)="toggle(i)"
              [attr.aria-expanded]="openIndex() === i"
              [attr.data-testid]="'faq-item-' + i"
            >
              <span class="text-body-md-strong pr-lg">{{ item.question }}</span>
              <span class="text-xl flex-shrink-0 font-bold transition-transform duration-300"
                [style.transform]="openIndex() === i ? 'rotate(45deg)' : 'rotate(0deg)'">
                +
              </span>
            </button>
            <div class="faq-body" [class.open]="openIndex() === i" [attr.data-testid]="'faq-answer-' + i">
              <div>
                <p class="text-body-sm opacity-90">{{ item.answer }}</p>
              </div>
            </div>
          </div>
        }
      </div>
    </section>
  `,
})
export class Faq {
  protected readonly openIndex = signal<number | null>(null);

  protected readonly faqs: FaqItem[] = [
    {
      question: '¿Los productos son frescos y de alta calidad?',
      answer: 'Sí, todos nuestros productos pasan por estrictos controles de calidad. Trabajamos directamente con productores locales y proveedores certificados para garantizar la frescura y calidad de cada artículo que llega a tus manos.',
    },
    {
      question: '¿Cuáles son sus horarios de entrega?',
      answer: 'Realizamos entregas de lunes a sábado de 8:00 AM a 9:00 PM. Los pedidos realizados antes de las 2:00 PM se entregan el mismo día. Los pedidos después de esa hora se programan para el siguiente día hábil.',
    },
    {
      question: '¿Qué métodos de pago aceptan?',
      answer: 'Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express), PayPal, transferencias bancarias, y pago contra reembolso en áreas seleccionadas. Todos los pagos están protegidos con encriptación SSL.',
    },
    {
      question: '¿Ofrecen descuentos o promociones?',
      answer: 'Sí, ofrecemos descuentos exclusivos para nuevos usuarios, promociones semanales, cupones de temporada y un programa de fidelidad donde acumulas puntos con cada compra que puedes canjear por descuentos.',
    },
    {
      question: '¿Cómo puedo dejar feedback sobre mi experiencia?',
      answer: 'Puedes calificar y reseñar productos directamente desde tu historial de pedidos. También puedes contactarnos a través de nuestro chat en vivo, correo electrónico o redes sociales. Tu opinión nos ayuda a mejorar.',
    },
    {
      question: '¿Ofrecen pedidos al por mayor para eventos o empresas?',
      answer: 'Sí, contamos con un programa especial para empresas y eventos. Ofrecemos precios mayoristas, entregas programadas y atención personalizada. Contáctanos a ventas@market.com para más información.',
    },
  ];

  protected toggle(index: number): void {
    this.openIndex.set(this.openIndex() === index ? null : index);
  }
}
