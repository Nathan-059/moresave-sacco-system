const fs = require('fs');
const path = require('path');

async function test() {
  const form = new FormData();
  form.append('memberNumber', 'MRS1000');
  form.append('type', 'deposit');
  form.append('amount', '20000');
  form.append('paymentMethod', 'cash');
  form.append('description', 'SAVE');
  // form.append('phoneNumber', '');
  // form.append('provider', '');

  // Create a dummy PDF file content
  const pdfBlob = new Blob(['%PDF-1.4 dummy content'], { type: 'application/pdf' });
  // form.append('receipt', pdfBlob, 'Sylviapayment.pdf');

  try {
    const res = await fetch('http://localhost:5000/api/savings/request', {
      method: 'POST',
      body: form
    });
    const data = await res.json();
    console.log('Response:', data);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

test();
