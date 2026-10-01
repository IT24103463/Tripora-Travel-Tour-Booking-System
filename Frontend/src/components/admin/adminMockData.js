export const adminMockBookings = [
  { id: 'BK-LK-9021', guest: 'Kasun Perera', destination: 'Sigiriya Rock & Elephant Safari', date: '2026-09-24', amount: 97000, status: 'Confirmed / Paid' },
  { id: 'BK-LK-8842', guest: 'Dilani Silva', destination: '98 Acres Luxury Chalet (2 Nights)', date: '2026-09-23', amount: 164000, status: 'Confirmed / Paid' },
  { id: 'BK-LK-7731', guest: 'Chaminda Fernando', destination: 'Yala Leopard Glamping Safari', date: '2026-09-22', amount: 124000, status: 'Pending Approval' },
  { id: 'BK-LK-6604', guest: 'Nuwan Bandara', destination: 'Galle Dutch Fort Catamaran Tour', date: '2026-09-21', amount: 59000, status: 'Confirmed / Paid' },
  { id: 'BK-LK-5519', guest: 'Sachini Jayawardena', destination: 'Nuwara Eliya Heritage High-Tea', date: '2026-09-20', amount: 84000, status: 'Confirmed / Paid' },
];

export const adminMockTours = [
  { id: 'lk-sigiriya', name: 'Sigiriya Rock & Elephant Safari', location: 'Sigiriya, Cultural Triangle', price: 48500, duration: '2 days', booked: 16, capacity: 20, image: 'photo-1588598198321-9735fd524c1b' },
  { id: 'lk-ella', name: 'Ella & Central Highlands Escape', location: 'Ella, Central Highlands', price: 82000, duration: '3 days', booked: 12, capacity: 18, image: 'photo-1588598198321-9735fd524c1b' },
  { id: 'lk-galle', name: 'Galle Fort & South Coast Voyage', location: 'Galle, Southern Province', price: 59000, duration: '2 days', booked: 14, capacity: 20, image: 'photo-1586861635167-e5223aadc9fe' },
  { id: 'lk-yala', name: 'Yala Leopard Glamping Safari', location: 'Yala, Southern Province', price: 124000, duration: '2 nights', booked: 9, capacity: 12, image: 'photo-1516026672322-bc52d61a55d5' },
  { id: 'lk-nuwara-eliya', name: 'Nuwara Eliya Heritage High-Tea', location: 'Nuwara Eliya, Hill Country', price: 48500, duration: '1 day', booked: 11, capacity: 16, image: 'photo-1588598198321-9735fd524c1b' },
  { id: 'lk-mirissa', name: 'Mirissa Whale & Coast Retreat', location: 'Mirissa, Southern Coast', price: 97000, duration: '3 days', booked: 13, capacity: 18, image: 'photo-1500375592092-40eb2168fd21' },
];

export const adminMockHotels = [
  { id: 'lk-hotel-1', name: '98 Acres Resort & Spa', location: 'Ella, Central Highlands', rooms: 2, active: true, pricePerNight: 82000 },
  { id: 'lk-hotel-2', name: 'Jetwing Vil Uyana', location: 'Sigiriya, Cultural Triangle', rooms: 8, active: true, pricePerNight: 97000 },
  { id: 'lk-hotel-3', name: 'Wild Coast Tented Lodge', location: 'Yala National Park', rooms: 5, active: true, pricePerNight: 164000 },
  { id: 'lk-hotel-4', name: 'The Fort Printers', location: 'Galle Fort, Southern Coast', rooms: 7, active: true, pricePerNight: 59000 },
  { id: 'lk-hotel-5', name: 'Heritance Tea Factory', location: 'Nuwara Eliya, Hill Country', rooms: 9, active: true, pricePerNight: 84000 },
];

export const adminMockDestinations = [
  ['Sigiriya & Cultural Triangle', 38],
  ['Ella & Central Highlands', 27],
  ['Galle Fort & South Coast', 21],
  ['Yala Safari & Wildlife', 14],
];

export const adminNotifications = [
  'New Luxury Tour Booking: Kasun Perera booked Sigiriya Rock Fortress for LKR 97,000',
  'High Season Alert: 98 Acres Resort & Spa Ella has only 2 chalets remaining for the upcoming long weekend',
  'Payment Stream: Transaction TXN-LK88491 confirmed via Local Banking Gateway / Card Outbox',
  'Yala Safari Guide: Private 4x4 naturalist roster assigned for tomorrow morning',
];
