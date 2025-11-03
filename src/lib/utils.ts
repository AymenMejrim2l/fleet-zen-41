import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formate un montant en Dinar Tunisien (TND)
 * @param amount - Le montant à formater
 * @param decimals - Nombre de décimales (par défaut 2)
 * @returns Le montant formaté avec le symbole TND
 */
export function formatCurrency(amount: number | string, decimals: number = 2): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return "0.00 TND";
  }
  
  return `${numAmount.toFixed(decimals)} TND`;
}
