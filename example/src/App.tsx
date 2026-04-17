import * as React from 'react';

import {
  StyleSheet,
  View,
  Image,
  Button,
  ScrollView,
  Text,
  SafeAreaView,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { convert } from 'react-native-pdf-to-image';

export default function App() {
  const [result, setResult] = React.useState<string[]>([]);

  const handleDocSelect = async () => {
    try {
      const docs = await DocumentPicker.pick({
        type: DocumentPicker.types.pdf,
        copyTo: 'cachesDirectory',
      });
      if (docs?.length) {
        const uri = docs[0]?.fileCopyUri || '';
        const images = await convert(uri);
        if (images.outputFiles) {
          setResult(images.outputFiles);
        }
      }
      console.log('Docs picked', docs);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.ctaContainer}>
        <Button title={'Select a PDF file'} onPress={handleDocSelect} />
      </View>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {result.length
          ? result.map((imgPath) => {
              return (
                <View key={imgPath} style={styles.imgContainer}>
                  <Text>{`file://${imgPath}`}</Text>
                  <Image
                    style={styles.image}
                    source={{ uri: `file://${imgPath}` }}
                  />
                </View>
              );
            })
          : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  ctaContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  imgContainer: {
    paddingVertical: 8,
  },
  image: {
    width: 200,
    height: 200,
  },
});
