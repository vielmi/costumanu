"use client";

import * as React from "react";
import { Accordion as AccordionPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Accordion({ ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item data-slot="accordion-item" className={cn("", className)} {...props} />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex border-b border-[color:var(--secondary-600)]">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group flex flex-1 items-center justify-between gap-4 pt-4 pb-1 text-left transition-all outline-none disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        style={{
          fontFamily: "var(--font-family-base)",
          fontSize: "var(--font-size-400)",
          fontWeight: 500,
          color: "var(--secondary-900)",
        }}
        {...props}
      >
        {children}
        <span
          className="pointer-events-none shrink-0 group-data-[state=open]:hidden"
          style={{
            fontSize: 22,
            fontWeight: 300,
            lineHeight: 1,
            color: "var(--secondary-900)",
          }}
        >
          +
        </span>
        <span
          className="pointer-events-none shrink-0 group-data-[state=closed]:hidden"
          style={{
            fontSize: 20,
            fontWeight: 400,
            lineHeight: 1,
            color: "var(--secondary-900)",
          }}
        >
          ×
        </span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden"
      {...props}
    >
      <div className={cn("pt-4 pb-8", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
