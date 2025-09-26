# Chameleon Ultra Amiibo Emulator

A comprehensive web-based interface for managing and emulating Amiibo on the Chameleon Ultra device via Bluetooth Low Energy (BLE).

## ✨ Features

### 🎮 Amiibo Management
- **Generate Real Amiibos**: Create legitimate Amiibo data with random UIDs using retail encryption keys
- **Upload Custom Files**: Support for both `.bin` and `.nfc` file formats
- **UID Randomization**: Generate fresh UIDs for existing Amiibos to avoid detection
- **Slot Management**: Manage all 8 device slots with clear, rename, and activation controls

### 🔍 Advanced Search & Browse
- **Comprehensive Database**: Browse 800+ official Amiibo figures and cards
- **Smart Filtering**: Filter by game series, character name, or Amiibo series
- **Multiple Sort Options**: Sort by release date (newest/oldest) or alphabetically
- **Visual Results**: Rich search results with official artwork and detailed information

## 🚀 Getting Started

### Prerequisites
- **Chameleon Ultra device** with compatible firmware
- **Modern web browser** with Web Bluetooth support (Chrome, Edge, Opera)
- **Retail Amiibo keys** (not included - must be obtained legally)

### Quick Start
1. **Open the application** in a supported browser
2. **Load your retail keys** using the key management section
3. **Connect to your device** via the "Connect to Chameleon Ultra" button
4. **Start managing Amiibos!**

## 📖 How to Use

### Initial Setup
1. **Load Retail Keys**
   - Click "Choose File" in the Retail Key Status section
   - Select your `key_retail.bin` file
   - Keys will be validated and stored securely in browser storage

2. **Connect Device**
   - Ensure your Chameleon Ultra is powered on and in range
   - Click "Connect to Chameleon Ultra"
   - Select your device from the Bluetooth pairing dialog
   - Battery status and slot information will load automatically

### Managing Slots

#### View Slot Information
- Connected slots display: Amiibo name, artwork, series information, and UID
- Empty slots show: "Empty" status with upload options
- Active slot is clearly marked with visual indicators

#### Upload Amiibo Files
- **Via Upload Button**: Click "Upload" → select file → choose options → confirm
- **UID Randomization**: Toggle option to generate random UIDs during upload

#### Generate New Amiibos
1. Click "Generate" on any slot
2. Search for desired Amiibo using the comprehensive database
3. Filter by game series or sort by release date
4. Click on any result to select and generate

#### Randomize Existing UIDs
- Click "Randomize UID" on slots with existing Amiibo data
- Generates fresh random UID while preserving Amiibo identity
- Useful for avoiding game detection of "used" Amiibos

## 🛠 Technical Details

### Supported File Formats
- **`.bin` files**: Raw Amiibo dump format (540 bytes)
- **`.nfc` files**: NFC Tools format with metadata
- **Auto-detection**: Format automatically detected and parsed

### Browser Compatibility
| Browser | Windows | macOS | Linux | Android | iOS |
|---------|---------|-------|-------|---------|-----|
| Chrome  | ✅      | ✅    | ✅    | ✅      | ❌  |
| Edge    | ✅      | ✅    | ✅    | ✅      | ❌  |
| Opera   | ✅      | ✅    | ✅    | ✅      | ❌  |
| Firefox | ❌      | ❌    | ❌    | ❌      | ❌  |
| Safari  | ❌      | ❌    | ❌    | ❌      | ❌  |

*iOS/Safari don't support Web Bluetooth API*

## 🤝 Contributing

### Reporting Issues
- Use the GitHub issue tracker for bugs and feature requests
- Include browser version, device model, and steps to reproduce
- Provide console logs when possible

### Development Setup
1. Clone the repository
2. Serve files through a local web server (required for Web Bluetooth)
3. Use browser developer tools for debugging
4. Use enableDebug() in developer console to enable debug logs
5. Test with actual Chameleon Ultra hardware

## ⚖️ Legal & Disclaimer

### Important Notes
- **Retail keys are not included** and must be obtained through legal means
- **Respect copyright**: Only create Amiibos for characters you own
- **Educational purpose**: This tool is for learning and legitimate backup purposes
- **Use responsibly**: Follow all applicable laws and Nintendo's terms of service

### License
This project is provided as-is for educational purposes. Users are responsible for compliance with all applicable laws and regulations.

## 🆘 Troubleshooting

### Common Issues

**"Device not found" during connection**
- Ensure device is powered on and in pairing mode
- Check if Web Bluetooth is enabled in browser settings
- Try refreshing the page and reconnecting

**"No retail keys loaded" error**
- Verify your keys file is in the correct format
- Keys must include both `unfixed_info` and `locked_secret` data
- Check browser console for specific validation errors

**Slow performance or timeouts**
- Ensure stable Bluetooth connection (stay within range)
- Avoid interference from other Bluetooth devices
- Try refreshing the page for a clean connection

### Getting Help
- Check the browser console (F12) for detailed error messages
- Ensure you're using a supported browser and operating system
- Verify your Chameleon Ultra firmware is up to date

## 🙏 Acknowledgments

Special thanks to the developers of these essential projects that made this application possible:

- **[pyamiibo](https://github.com/tobywf/pyamiibo)** - Python library for Amiibo encryption/decryption
- **[AmiiboConverter](https://github.com/Lanjelin/AmiiboConverter)** - Amiibo file format conversion tools
- **[maboii.js](https://github.com/Entrivax/maboii.js)** - JavaScript Amiibo generation library

This project builds upon the incredible work of the Amiibo homebrew community.

---

**Made with ❤️ for the Chameleon Ultra community**

*This is an unofficial tool and is not affiliated with the Chameleon Ultra development team.*
