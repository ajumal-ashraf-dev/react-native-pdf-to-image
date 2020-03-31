
# react-native-pdf-to-image

## Getting started

`$ npm install react-native-pdf-to-image --save`

### Mostly automatic installation. No need to Link if (RN > 0.60)

`$ react-native link react-native-pdf-to-image`

### Manual installation


#### Android

1. Open up `android/app/src/main/java/[...]/MainActivity.java`
  - Add `import com.reactlibrary.RNPdfToImagePackage;` to the imports at the top of the file
  - Add `new RNPdfToImagePackage()` to the list returned by the `getPackages()` method
2. Append the following lines to `android/settings.gradle`:
  	```
  	include ':react-native-pdf-to-image'
  	project(':react-native-pdf-to-image').projectDir = new File(rootProject.projectDir, 	'../node_modules/react-native-pdf-to-image/android')
  	```
3. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
  	```
      compile project(':react-native-pdf-to-image')
  	```


## Usage
```javascript
import RNPdfToImage from 'react-native-pdf-to-image';

RNPdfToImage.convert(uri);
```
  