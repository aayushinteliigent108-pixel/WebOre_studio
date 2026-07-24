const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  // Delete old fake testimonials
  await p.testimonial.deleteMany({});
  
  // Create new authentic testimonials
  await p.testimonial.createMany({
    data: [
      { name: 'Webore Portfolio', role: 'Our Work', company: 'Webore', quote: 'Every project we deliver is crafted with precision, care, and a commitment to excellence that shows in the results.', rating: 5, imageSource: 'web', attribution: 'Webore' },
      { name: 'Webore Process', role: 'How We Work', company: 'Webore', quote: 'From discovery to launch, our process ensures every project is delivered on time, within budget, and beyond expectations.', rating: 5, imageSource: 'web', attribution: 'Webore' },
      { name: 'Webore Quality', role: 'Our Standards', company: 'Webore', quote: "We don't cut corners. Every pixel, every line of code, every interaction is designed to deliver real business results.", rating: 5, imageSource: 'web', attribution: 'Webore' },
    ],
  });
  
  const count = await p.testimonial.count();
  console.log('Testimonials updated:', count, 'records');
  await p.$disconnect();
})();
