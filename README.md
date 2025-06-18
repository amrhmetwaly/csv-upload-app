# CSV Upload & Analysis Application

A modern, stunning Next.js application for uploading and analyzing CSV files with custom usage thresholds. Built with TypeScript, Tailwind CSS, and featuring a beautiful, user-friendly interface.

## 🚀 Features

- **Beautiful UI/UX**: Modern, responsive design with smooth animations and gradient backgrounds
- **Drag & Drop Upload**: Intuitive file upload with drag-and-drop functionality
- **Real-time Validation**: Comprehensive form validation with immediate feedback
- **CSV Processing**: Intelligent CSV parsing and analysis
- **Threshold Analysis**: Automatic detection of usage columns and threshold comparisons
- **Alert System**: Smart notification system with auto-dismissal
- **Error Handling**: Robust error handling with user-friendly messages
- **TypeScript**: Full type safety throughout the application
- **Responsive Design**: Optimized for desktop and mobile devices

## 🛠️ Technology Stack

- **Framework**: Next.js 15.3.3 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Heroicons & Lucide React
- **File Processing**: Built-in FormData API
- **Animations**: Custom CSS animations with Tailwind

## 📋 Prerequisites

- Node.js 18.0 or higher
- npm, yarn, or pnpm

## 🚀 Getting Started

1. **Clone the repository** (if applicable):
   ```bash
   git clone <repository-url>
   cd csv-upload-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser** and navigate to [http://localhost:3000](http://localhost:3000)

## 📄 Sample Data

The application includes a sample CSV file (`public/sample-usage-data.csv`) with energy usage data for testing. You can download this file and use it to test the upload functionality.

Sample data includes:
- Customer information
- Usage in kWh
- Billing periods
- Rate plans
- Locations

## 🔧 API Endpoints

### POST /api/upload

Handles CSV file uploads and processing.

**Request**:
- `file`: CSV file (FormData)
- `threshold`: Numeric threshold value (FormData)

**Response**:
```json
{
  "message": "CSV file processed successfully!",
  "data": {
    "fileName": "sample-data.csv",
    "fileSize": "1.2 KB",
    "uploadedAt": "2024-01-15T10:30:00.000Z",
    "totalRows": 10,
    "invalidRows": 0,
    "headers": ["Customer ID", "Name", "Usage (kWh)", ...],
    "usageColumns": ["Usage (kWh)"],
    "threshold": 1000,
    "thresholdAnalysis": {
      "usageColumn": "Usage (kWh)",
      "rowsAboveThreshold": 4,
      "percentageAboveThreshold": "40.0"
    }
  }
}
```

## 📊 How It Works

1. **File Upload**: Users can either drag and drop a CSV file or click to browse
2. **Threshold Input**: Enter a numeric threshold for usage analysis
3. **Validation**: The system validates file type, size, and threshold values
4. **Processing**: The backend processes the CSV, validates structure, and analyzes data
5. **Results**: Users receive detailed feedback about the processing results

## 🎨 Design Features

- **Gradient Backgrounds**: Beautiful gradient from indigo to cyan
- **Smooth Animations**: CSS transitions and custom keyframe animations
- **Interactive Elements**: Hover effects, focus states, and button animations
- **Alert System**: Color-coded alerts with icons and auto-dismissal
- **Responsive Layout**: Mobile-first design with responsive breakpoints
- **Accessibility**: Proper ARIA labels and keyboard navigation

## 🛡️ Validation & Security

- **File Type Validation**: Only CSV files are accepted
- **File Size Limits**: Maximum 10MB file size
- **Input Sanitization**: All inputs are validated and sanitized
- **Error Boundaries**: Comprehensive error handling throughout the application
- **Type Safety**: Full TypeScript implementation

## 🔄 Form Features

- **Real-time Validation**: Immediate feedback on form inputs
- **Smart Alerts**: Context-aware error, warning, info, and success messages
- **Auto-reset**: Form clears after successful submission
- **Loading States**: Visual feedback during processing
- **Drag States**: Visual feedback during drag operations

## 📱 Responsive Design

The application is fully responsive and works seamlessly across:
- Desktop computers
- Tablets
- Mobile phones
- Touch devices

## 🎯 Usage Examples

### Basic Usage
1. Open the application
2. Upload a CSV file with usage data
3. Enter a threshold value (e.g., 1000)
4. Click "Upload & Process"
5. View the analysis results

### Advanced Features
- The system automatically detects usage columns (keywords: usage, consumption, amount, quantity, value, kwh, units)
- Provides detailed statistics about rows above/below threshold
- Shows file processing details and validation results

## 🚀 Production Deployment

To deploy this application:

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm start
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🔧 Development

### Project Structure
```
csv-upload-app/
├── src/
│   ├── app/
│   │   ├── api/upload/
│   │   │   └── route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── components/ (for future components)
├── public/
│   └── sample-usage-data.csv
├── tailwind.config.ts
└── package.json
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

---

Built with ❤️ by Amr Metwaly for Portland General Electric Assessment
