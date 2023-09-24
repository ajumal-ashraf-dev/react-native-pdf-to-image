import * as React from 'react';

import {
  StyleSheet,
  View,
  Image,
  Button,
  ScrollView,
  Text,
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
    <View style={styles.container}>
      <Button title={'Select a PDF file'} onPress={handleDocSelect} />
      <ScrollView style={styles.scrollContainer}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  scrollContainer: {
    flex: 1,
    marginTop: 40,
  },
  imgContainer: {
    flex: 1,
    padding: 5,
  },
  image: {
    width: 200,
    height: 200,
  },
});
