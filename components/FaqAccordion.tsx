"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/components/icons";

export type FaqItem = { question: string; answer: string };

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-black/5 rounded-2xl border border-black/5 bg-white shadow-sm">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
            >
              <span className="font-medium text-navy">{item.question}</span>
              <ChevronDownIcon
                className={`h-5 w-5 shrink-0 text-primary transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isOpen && <p className="px-5 pb-4 text-sm text-neutral-600">{item.answer}</p>}
          </div>
        );
      })}
    </div>
  );
}
