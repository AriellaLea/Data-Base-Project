import csv
import random
from datetime import date, timedelta

# 1. Configuration
row_count = 20000
file_name = "customers.csv"

# Function to generate a random birth date
def generate_birth_date():
    start_date = date(1970, 1, 1)
    # Generates a date between 1970 and roughly 2019
    return start_date + timedelta(days=random.randint(0, 18000))

# 2. File Creation
with open(file_name, mode='w', newline='', encoding='utf-8') as file:
    writer = csv.writer(file)
    
    # WRITE HEADER (must match SQL columns exactly)
    writer.writerow(['customer_id', 'name', 'email', 'date_of_birth', 'loyalty_level_id', 'points_balance'])
    
    # 3. Generation Loop
    for i in range(1, row_count + 1):
        customer_id = i
        name = f"Customer_{i}"
        email = f"customer{i}@example.com"
        dob = generate_birth_date()
        loyalty_id = random.randint(1, 5) # Assuming 5 loyalty levels exist
        points = random.randint(0, 5000)
        
        # Write row to CSV
        writer.writerow([customer_id, name, email, dob, loyalty_id, points])

print(f"File {file_name} generated successfully with {row_count} records!")
