# 🏁 Quarterboard Designer

A modern, interactive 3D quarterboard customization tool built with Next.js, Three.js, and React Three Fiber.

## ✨ Features

### 🎨 **Enhanced UI Design**
- **Clean Left Sidebar**: Organized controls with tabbed navigation
- **Collapsible Interface**: Sidebar can be collapsed for more 3D viewing space
- **Modern Glass Design**: Beautiful glassmorphism effects throughout
- **Responsive Layout**: Works perfectly on all screen sizes
- **Dark/Light Mode**: Seamless theme switching

### 🎯 **Individual Mesh Coloring**
- **Click to Select**: Click directly on model parts in the 3D view
- **Independent Colors**: Each mesh part can have its own color
- **Real-time Updates**: See color changes instantly in the 3D viewer
- **Color Picker**: Both visual color picker and hex input support
- **Mesh List**: Dropdown selector for precise part selection

### 📝 **Advanced 3D Text**
- **Click-to-Place**: Enable editing mode and click to position text
- **Multiple Fonts**: Choose from various professional fonts
- **Material Styles**: Standard, Glowing, and Engraved text options
- **Real-time Positioning**: Manual coordinate controls with live preview
- **Text Scaling**: Smooth scaling controls for perfect sizing
- **Visual Feedback**: Clear indicators when in text editing mode

### ⚡ **Performance Optimization**
- **Auto Performance Mode**: Automatically detects device capabilities
- **FPS Monitoring**: Real-time frame rate display (development mode)
- **Quality Toggle**: Switch between performance and quality modes
- **Smart Rendering**: Optimized rendering pipeline for smooth experience

### 🎮 **Enhanced 3D Experience**
- **Improved Lighting**: Professional lighting setup with shadows
- **Better Camera**: Optimized camera positioning and controls
- **Visual Enhancements**: Tone mapping and improved materials
- **Grid System**: Professional grid overlay for spatial reference

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd quarterboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎛️ How to Use

### **Basic Model Selection**
1. Use the **Model** tab in the left sidebar
2. Select from available quarterboard models
3. Adjust the base model color

### **Individual Part Coloring**
1. Switch to the **Colors** tab
2. **Method 1**: Click directly on model parts in the 3D view
3. **Method 2**: Use the dropdown to select specific parts
4. Use the color picker to customize each part independently

### **3D Text Customization**
1. Go to the **Text** tab in the sidebar
2. Enter your desired text content
3. Choose font, color, and material style
4. **For positioning**:
   - Enable "click-to-place text" mode
   - Click anywhere on the model to position text
   - Use manual coordinates for precise placement

### **Performance Settings**
- Toggle between **Performance** and **Quality** modes in the top bar
- Performance mode automatically enables on slower devices
- Monitor FPS in development mode (top-right corner)

## 🎨 UI Layout

```
┌─────────────┬─────────────────────────────────────┐
│             │ Quarterboard Designer    [Controls] │
│   Sidebar   ├─────────────────────────────────────┤
│             │                                     │
│ [Model]     │         3D Viewer Area             │
│ [Colors]    │                                     │
│ [Text]      │      (Interactive 3D Model)        │
│             │                                     │
│             ├─────────────────────────────────────┤
│ [Actions]   │         [Text Controls]             │
└─────────────┴─────────────────────────────────────┘
```

## 🛠️ Technical Features

### **Modern Tech Stack**
- **Next.js 15**: Latest React framework with App Router
- **Three.js**: Advanced 3D graphics and rendering
- **React Three Fiber**: React components for Three.js
- **Tailwind CSS**: Utility-first styling with custom animations
- **TypeScript**: Full type safety throughout

### **3D Capabilities**
- **GLTF Model Loading**: Supports complex 3D models with materials
- **Real-time Mesh Manipulation**: Live color changes and selections
- **Advanced Lighting**: Multi-light setup with shadows and reflections
- **Post-processing**: Tone mapping and visual enhancements

### **Performance Features**
- **Device Detection**: Automatic performance optimization
- **Lazy Loading**: Components load only when needed
- **Optimized Rendering**: Smart frame rate limiting
- **Memory Management**: Proper cleanup of 3D resources

## 📋 Available Models

- Quarterboard (Base)
- Quarterboard_2 (Alternative)
- The Captain Ahab
- The Cisco Beach
- The Gaslight
- The Hilderbrand
- The Landbank
- The Madaket Millies
- The MarkFlow
- The Original
- The Sconset
- The Shangri-La

## 🎯 Key Improvements

### **From Previous Version**
- ✅ **Simplified Single Renderer**: Removed dual Babylon.js/Three.js setup
- ✅ **Enhanced UI**: Modern, organized interface with better UX
- ✅ **Individual Mesh Control**: Each part can be colored independently
- ✅ **Better Text System**: Advanced 3D text with multiple options
- ✅ **Performance Optimization**: Smart rendering and device adaptation
- ✅ **Improved Interactions**: Click-to-select and intuitive controls

### **User Experience**
- **Intuitive Navigation**: Clear visual hierarchy and logical grouping
- **Visual Feedback**: Immediate response to all user actions
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🔧 Development

### **Project Structure**
```
app/
├── components/           # React components
│   ├── app-sidebar.tsx  # Main sidebar with controls
│   ├── three-scene.tsx  # 3D scene component
│   └── r3f-model-viewer.tsx # Model viewer wrapper
├── globals.css          # Global styles and animations
└── page.tsx            # Main application page

lib/
├── model-utils.ts      # 3D model utilities
└── babylon-optimizer.ts # Performance optimizations

hooks/
├── use-device-performance.tsx # Device capability detection
└── use-performance-monitor.tsx # FPS monitoring
```

### **Key Components**
- **AppSidebar**: Tabbed interface with all controls
- **ThreeScene**: Main 3D rendering component
- **Model**: Individual 3D model with interaction handling
- **ModelUtils**: Utilities for mesh processing and color management

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🚀 Performance Tips

1. **Enable Performance Mode** on slower devices
2. **Close other browser tabs** for better performance
3. **Use latest browser version** for optimal WebGL support
4. **Ensure good GPU drivers** for best 3D performance

## 🎨 Customization

The application is built with customization in mind:
- **Themes**: Easy to modify color schemes in Tailwind config
- **Models**: Add new .glb files to the public/models directory
- **Fonts**: Add new fonts to public/fonts and update font list
- **Animations**: Custom CSS animations in globals.css

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ using modern web technologies for the best quarterboard customization experience.**