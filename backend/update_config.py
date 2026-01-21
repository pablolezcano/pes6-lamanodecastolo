import os
import yaml
import sys

def update_yaml(file_path, updates):
    if not os.path.exists(file_path):
        print(f"Config file not found: {file_path}")
        return

    try:
        with open(file_path, 'r') as f:
            config = yaml.safe_load(f) or {}
        
        changed = False
        for key_path, value in updates.items():
            if value is None:
                continue
            
            # Navigate to the correct key
            keys = key_path.split('.')
            current = config
            for k in keys[:-1]:
                if k not in current:
                    current[k] = {}
                current = current[k]
            
            # Update value if changed
            last_key = keys[-1]
            if current.get(last_key) != value:
                current[last_key] = value
                changed = True
                print(f"Updated {key_path}")

        if changed:
            with open(file_path, 'w') as f:
                yaml.dump(config, f, default_flow_style=False)
            print(f"Saved updates to {file_path}")
            
    except Exception as e:
        print(f"Error updating {file_path}: {e}")

def main():
    fsroot = os.environ.get('FSROOT', '.')
    
    # Update sixserver.yaml
    sixserver_path = os.path.join(fsroot, 'etc/conf/sixserver.yaml')
    sixserver_updates = {
        'DB.user': os.environ.get('MYSQL_USER'),
        'DB.password': os.environ.get('MYSQL_PASSWORD'),
        'DB.name': os.environ.get('MYSQL_DATABASE'),
        'ServerName': os.environ.get('SERVER_NAME'),
        'ServerIP': os.environ.get('SERVER_IP'),
        'cipherKey': os.environ.get('CIPHER_KEY'),
    }
    update_yaml(sixserver_path, sixserver_updates)

    # Update admin6.yaml
    admin6_path = os.path.join(fsroot, 'etc/conf/admin6.yaml')
    admin6_updates = {
        'AdminUser': os.environ.get('ADMIN_USER'),
        'AdminPassword': os.environ.get('ADMIN_PASSWORD'),
    }
    update_yaml(admin6_path, admin6_updates)

if __name__ == '__main__':
    main()
