import * as fs from 'fs';

// 1. Configuration
const rowCount = 20000;
const fileName = "customers.csv";

// Function to generate a random birth date
function generateBirthDate() {
    const startDate = new Date(1970, 0, 1);
    const randomDays = Math.floor(Math.random() * 18000);
    const resultDate = new Date(startDate.getTime() + randomDays * 24 * 60 * 60 * 1000);
    return resultDate.toISOString().split('T')[0];
}

function generateCsv() {
    const rows = [];
    
    // WRITE HEADER
    rows.push('customer_id,name,email,date_of_birth,loyalty_level_id,points_balance');
    
    // 3. Generation Loop
    for (let i = 1; i <= rowCount; i++) {
        const customerId = i;
        const name = `Customer_${i}`;
        const email = `customer${customerId}@example.com`;
        const dob = generateBirthDate();
        const loyaltyId = Math.floor(Math.random() * 5) + 1;
        const points = Math.floor(Math.random() * 5001);
        
        rows.push(`${customerId},${name},${email},${dob},${loyaltyId},${points}`);
    }
    
    fs.writeFileSync(fileName, rows.join('\n'));
    console.log(`File ${fileName} generated successfully with ${rowCount} records!`);
}

generateCsv();
