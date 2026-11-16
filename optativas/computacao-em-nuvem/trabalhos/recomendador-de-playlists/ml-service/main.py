import pandas as pd
import pickle
from mlxtend.preprocessing import TransactionEncoder
# 1. Mude o 'apriori' para 'fpgrowth' aqui
from mlxtend.frequent_patterns import fpgrowth, association_rules
import sys

# ... (as funções load_and_prep_data e encode_transactions não mudam) ...
def load_and_prep_data(file_list):
    """
    Loads and concatenates CSV files, then prepares 'baskets' for FIM.
    
    A 'basket' is a playlist (pid), and 'items' are the tracks (track_uri).
    """
    print(f"Loading data from {file_list}...")
    df_list = []
    for f in file_list:
        try:
            df_list.append(pd.read_csv(f))
        except FileNotFoundError:
            print(f"Warning: File {f} not found. Skipping.")
            
    if not df_list:
        print("Error: No data files found.")
        return None

    combined_df = pd.concat(df_list, ignore_index=True)
    print(f"Total track entries loaded: {len(combined_df)}")

    # Group by 'pid' (playlist) and collect all 'track_uri' (items) into a list
    print("Grouping tracks into playlists (baskets)...")
    # Using unique tracks per playlist
    baskets = combined_df.groupby('pid')['track_uri'].apply(lambda x: list(set(x))).tolist()
    
    print(f"Successfully created {len(baskets)} baskets (playlists).")
    
    return baskets

def encode_transactions(baskets):
    """
    Uses TransactionEncoder to convert the list of baskets into a 
    one-hot encoded DataFrame required by mlxtend's apriori.
    """
    print("Encoding transactions (one-hot encoding)...")
    te = TransactionEncoder()
    te_ary = te.fit(baskets).transform(baskets)
    df_one_hot = pd.DataFrame(te_ary, columns=te.columns_)
    
    print(f"Encoding complete. Shape of one-hot matrix: {df_one_hot.shape}")
    return df_one_hot


def generate_association_rules(df_one_hot, min_support, min_confidence):
    """
    Runs the FP-Growth algorithm and generates association rules.
    """
    print(f"Running FP-Growth with min_support={min_support}...")
    
    # 2. Mude a função de 'apriori' para 'fpgrowth'
    frequent_itemsets = fpgrowth(df_one_hot, min_support=min_support, use_colnames=True)
    
    if frequent_itemsets.empty:
        print("No frequent itemsets found. Try lowering your min_support threshold.")
        return None
        
    print(f"Found {len(frequent_itemsets)} frequent itemsets.")
    
    print(f"Generating association rules with min_confidence={min_confidence}...")
    # O resto da função (association_rules) é exatamente igual!
    rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=min_confidence)
    
    if rules.empty:
        print("No association rules found. Try lowering your min_confidence threshold.")
        return None
        
    print(f"Found {len(rules)} association rules.")
    
    # Sort by confidence and lift for better readability
    rules = rules.sort_values(['confidence', 'lift'], ascending=[False, False])
    
    print("\n--- Top 10 Rules ---")
    print(rules.head(10))
    
    return rules

# ... (a função save_rules não muda) ...
def save_rules(rules, output_file):
    """
    Saves the generated rules DataFrame to a file using pickle.
    """
    if rules is None:
        print("No rules to save.")
        return

    print(f"\nSaving rules to {output_file}...")
    try:
        with open(output_file, 'wb') as f:
            pickle.dump(rules, f)
        print(f"Successfully saved rules to {output_file}.")
    except Exception as e:
        print(f"Error saving rules: {e}")

# ... (o bloco __main__ não muda) ...
if __name__ == "__main__":
    
    # --- Configuration ---
    # Ensure mlxtend is installed: pip install mlxtend
    
    # Define the input files
    FILE_NAMES = ['data/2023_spotify_ds1.csv', 'data/2023_spotify_ds2.csv']
    
    # --- Tunable Parameters ---
    MIN_SUPPORT = 0.08  # Com FP-Growth, 0.01 pode funcionar!
    MIN_CONFIDENCE = 0.5
    
    # Define the output file for the rules
    OUTPUT_FILE = '/app/data/playlist_rules.pkl'
    
    # --- Execution ---
    
    # 1. Load data and create baskets
    playlist_baskets = load_and_prep_data(FILE_NAMES)
    
    if playlist_baskets:
        # 2. Encode baskets for Apriori
        df_encoded = encode_transactions(playlist_baskets)
        
        # 3. Generate association rules
        generated_rules = generate_association_rules(df_encoded, MIN_SUPPORT, MIN_CONFIDENCE)
        
        # 4. Save rules for the microservice
        save_rules(generated_rules, OUTPUT_FILE)

    print("\nPlaylist Rules Generator script finished.")
