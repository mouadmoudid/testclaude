import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility function for conditional CSS classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate unique order number
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `ORD-${timestamp}-${randomStr}`.toUpperCase();
}

// Format currency
export function formatCurrency(amount: number, currency: string = 'MAD'): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

// Format date
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-MA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

// Format date and time
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-MA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

// Calculate delivery estimate
export function calculateDeliveryEstimate(pickupDate: Date, serviceType: string = 'standard'): Date {
  const pickup = new Date(pickupDate);
  let daysToAdd = 3; // Standard delivery

  switch (serviceType.toLowerCase()) {
    case 'express':
      daysToAdd = 1;
      break;
    case 'same_day':
      daysToAdd = 0;
      break;
    case 'premium':
      daysToAdd = 2;
      break;
    default:
      daysToAdd = 3;
  }

  const deliveryDate = new Date(pickup);
  deliveryDate.setDate(pickup.getDate() + daysToAdd);
  
  // Skip weekends for delivery
  if (deliveryDate.getDay() === 0) { // Sunday
    deliveryDate.setDate(deliveryDate.getDate() + 1);
  } else if (deliveryDate.getDay() === 6) { // Saturday
    deliveryDate.setDate(deliveryDate.getDate() + 2);
  }

  return deliveryDate;
}

// Validate Moroccan phone number
export function validateMoroccanPhone(phone: string): boolean {
  const phoneRegex = /^(\+212|0)(5|6|7)[0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Generate pagination info
export function generatePaginationInfo(
  currentPage: number,
  totalCount: number,
  limit: number
) {
  const totalPages = Math.ceil(totalCount / limit);
  
  return {
    currentPage,
    totalPages,
    totalCount,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    limit
  };
}

// Calculate percentage change
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 100) / 100;
}

// Get order status color
export function getOrderStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    'PENDING': 'bg-yellow-100 text-yellow-800',
    'CONFIRMED': 'bg-blue-100 text-blue-800',
    'IN_PROGRESS': 'bg-purple-100 text-purple-800',
    'READY_FOR_PICKUP': 'bg-orange-100 text-orange-800',
    'OUT_FOR_DELIVERY': 'bg-indigo-100 text-indigo-800',
    'DELIVERED': 'bg-green-100 text-green-800',
    'COMPLETED': 'bg-green-100 text-green-800',
    'CANCELED': 'bg-red-100 text-red-800',
    'REFUNDED': 'bg-gray-100 text-gray-800',
  };
  
  return statusColors[status] || 'bg-gray-100 text-gray-800';
}

// Get laundry status color
export function getLaundryStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    'ACTIVE': 'bg-green-100 text-green-800',
    'INACTIVE': 'bg-gray-100 text-gray-800',
    'SUSPENDED': 'bg-red-100 text-red-800',
    'PENDING_APPROVAL': 'bg-yellow-100 text-yellow-800',
  };
  
  return statusColors[status] || 'bg-gray-100 text-gray-800';
}

// Format activity type for display
export function formatActivityType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Validate email format
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Truncate text
export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Generate rating stars
export function generateRatingStars(rating: number): string[] {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  
  for (let i = 0; i < fullStars; i++) {
    stars.push('full');
  }
  
  if (hasHalfStar) {
    stars.push('half');
  }
  
  while (stars.length < 5) {
    stars.push('empty');
  }
  
  return stars;
}

// Convert operating hours to readable format
export function formatOperatingHours(hours: any): string {
  if (!hours) return 'Hours not available';
  
  const days = Object.keys(hours);
  const openDays = days.filter(day => !hours[day].closed);
  
  if (openDays.length === 0) return 'Closed';
  
  // Check if all open days have same hours
  const firstOpenDay = openDays[0];
  const sameHours = openDays.every(day => 
    hours[day].open === hours[firstOpenDay].open && 
    hours[day].close === hours[firstOpenDay].close
  );
  
  if (sameHours && openDays.length === 7) {
    return `Daily: ${hours[firstOpenDay].open} - ${hours[firstOpenDay].close}`;
  }
  
  if (sameHours && openDays.length === 5 && 
      openDays.every(day => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day))) {
    return `Mon-Fri: ${hours[firstOpenDay].open} - ${hours[firstOpenDay].close}`;
  }
  
  return 'Variable hours';
}