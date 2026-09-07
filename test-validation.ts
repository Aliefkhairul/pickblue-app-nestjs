import { ValidationPipe } from '@nestjs/common';
const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
async function test() {
  try {
    const result = await pipe.transform({ order_id: '123' }, { type: 'body', metatype: Object as any });
    console.log("Result:", result);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
