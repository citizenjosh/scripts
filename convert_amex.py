import csv
import sys
import os

# --- CONFIGURATION ---
# 1. The name of your file (must be in the same folder)
INPUT_FILE = '[DOWNLOADED AMEX TRANSACTIONS].csv'

# 2. The exact name of the account in Quicken (e.g., 'AmEx Platinum')
#    If you leave this blank "", Quicken will ask you to select the account during import.
ACCOUNT_NAME = "[ACCOUNT/REGISTRY NAME]"

# 3. Output file name (automatically adds .qif)
OUTPUT_FILE = INPUT_FILE + '.qif'

def clean_text(text):
    """Removes newlines and extra spaces that break QIF files."""
    if not text:
        return ""
    # Replace line breaks with spaces, then strip leading/trailing whitespace
    return " ".join(text.split())

def convert_csv_to_qif():
    print(f"Reading {INPUT_FILE}...")
    
    if not os.path.exists(INPUT_FILE):
        print(f"Error: Could not find '{INPUT_FILE}'. Make sure it is in this folder.")
        return

    try:
        with open(INPUT_FILE, mode='r', encoding='utf-8-sig') as csv_file:
            reader = csv.DictReader(csv_file)
            
            # Print found columns for verification
            print(f"Detected columns: {reader.fieldnames}")
            
            with open(OUTPUT_FILE, mode='w', encoding='utf-8') as qif_file:
                
                # --- A. Write Account Header (Optional but Recommended) ---
                if ACCOUNT_NAME:
                    qif_file.write("!Account\n")
                    qif_file.write(f"N{ACCOUNT_NAME}\n")
                    qif_file.write("TCCard\n")
                    qif_file.write("^\n")
                
                # --- B. Write Transaction Type Header ---
                qif_file.write("!Type:CCard\n")
                
                count = 0
                for row in reader:
                    # --- C. Extract Data ---
                    date = clean_text(row.get('Date'))
                    payee = clean_text(row.get('Description'))
                    
                    # Specific check for the 'Amount' column
                    amount_str = row.get('Amount', '0').strip()
                    
                    # Optional columns
                    category = clean_text(row.get('Category'))
                    
                    # Build a smart memo from whatever extra columns exist
                    memo_parts = []
                    potential_memo_cols = [
                        'Extended Details', 
                        'Appears On Your Statement As', 
                        'Address', 
                        'City/State', 
                        'Zip Code', 
                        'Country'
                    ]
                    for col in potential_memo_cols:
                        val = row.get(col)
                        if val:
                            memo_parts.append(clean_text(val))
                    
                    memo = " - ".join(memo_parts)

                    # --- D. Amount Handling ---
                    try:
                        amt_float = float(amount_str)
                        # Force negative for expenses (standard Quicken requirement)
                        final_amount = -abs(amt_float)
                    except ValueError:
                        continue 

                    # --- E. Write Transaction ---
                    if date and amount_str:
                        qif_file.write(f"D{date}\n")
                        qif_file.write(f"T{final_amount:.2f}\n")
                        qif_file.write(f"P{payee}\n")
                        
                        if category:
                            qif_file.write(f"L{category}\n")
                        if memo:
                            qif_file.write(f"M{memo}\n")
                        
                        qif_file.write("^\n") 
                        count += 1
                
                print(f"Success! Converted {count} transactions.")
                print(f"File saved as: {OUTPUT_FILE}")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    convert_csv_to_qif()
