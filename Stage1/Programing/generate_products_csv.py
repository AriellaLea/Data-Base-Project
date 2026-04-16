import csv
import random

row_count = 20000
file_name = "products.csv"

with open(file_name, mode='w', newline='', encoding='utf-8') as file:
    writer = csv.writer(file)
    writer.writerow(['product_id', 'product_name', 'category_id', 'price', 'stock_quantity'])
    
    for i in range(1, row_count + 1):
        writer.writerow([
            i, 
            f"Product_{i}", 
            random.randint(1, 500), # Lien vers les 500 catégories créées
            random.randint(10, 5000), 
            random.randint(0, 1000)
        ])

print(f"Fichier {file_name} généré !")