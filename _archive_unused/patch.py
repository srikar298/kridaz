import sys

file_path = 'client/user/src/features/chat/components/ChatWindow.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Replace the signature
for i, line in enumerate(lines):
    if 'const ChatWindow = ({ chat, onBack, onSelectChat }) => {' in line:
        lines[i] = line.replace('({ chat, onBack, onSelectChat })', '({ chat, onBack, onSelectChat, prefillMessage })')
        break

# Find the setMessages useEffect and insert the prefillMessage useEffect right after it
for i, line in enumerate(lines):
    if 'setMessages(data);' in line:
        # It should end around i+2
        insert_idx = i + 3
        lines.insert(insert_idx, """
  useEffect(() => {
    if (prefillMessage && chat && !message) {
      setMessage(prefillMessage);
      const url = new URL(window.location);
      url.searchParams.delete("prefill");
      window.history.replaceState({}, "", url);
    }
  }, [prefillMessage, chat]);
""")
        break

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
