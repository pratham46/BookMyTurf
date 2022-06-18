import { useNavigation } from '@react-navigation/native'
import React from 'react'
import {Image, StyleSheet, Text, TouchableOpacity, View, ScrollView} from 'react-native'
import Octicons from "react-native-vector-icons/Octicons";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";

const HomeScreen = () => {
  const navigation = useNavigation()

  return (
    <ScrollView>
      <View  style={styles.container}>
        <TouchableOpacity style={[styles.card,styles.elevation]}
        onPress={() => (navigation.navigate('Turf1Description'))}>
            <Image source={require("../assets/turf1.png")} style={{height: 150, width: 150,borderRadius: 5,marginEnd: 10}} />
            <View style={{flexDirection: 'column'}}>
                <Text style={styles.heading}>Turf 1</Text>
                <View style={{flexDirection: 'row'}}>
                    <Octicons name='location' color={"#298a3d"} size={17} style={{marginBottom: 7,marginTop: 7, marginEnd: 3}}/>
                    <Text style={styles.subtitle}>Matunga</Text>
                </View>
                <View style={{flexDirection: 'row'}}>
                    <FontAwesome5 name='rupee-sign' color={"#298a3d"} size={30} style={{marginBottom: 7,marginTop: 7, marginEnd: 3}}/>
                    <Text style={styles.price}>999</Text>
                </View>
            </View>
        </TouchableOpacity>
          <TouchableOpacity style={[styles.card,styles.elevation]}
                            onPress={() => (navigation.navigate('Turf2Description'))}>
              <Image source={require("../assets/turf2.png")} style={{height: 150, width: 150,borderRadius: 5,marginEnd: 10}} />
              <View style={{flexDirection: 'column'}}>
                  <Text style={styles.heading}>Turf 2</Text>
                  <View style={{flexDirection: 'row'}}>
                      <Octicons name='location' color={"#298a3d"} size={17} style={{marginBottom: 7,marginTop: 7, marginEnd: 3}}/>
                      <Text style={styles.subtitle}>Borivali</Text>
                  </View>
                  <View style={{flexDirection: 'row'}}>
                      <FontAwesome5 name='rupee-sign' color={"#298a3d"} size={30} style={{marginBottom: 7,marginTop: 7, marginEnd: 3}}/>
                      <Text style={styles.price}>800</Text>
                  </View>
              </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.card,styles.elevation]}
                            onPress={() => (navigation.navigate('Turf3Description'))}>
              <Image source={require("../assets/turf3.png")} style={{height: 150, width: 150,borderRadius: 5,marginEnd: 10}} />
              <View style={{flexDirection: 'column'}}>
                  <Text style={styles.heading}>Turf 3</Text>
                  <View style={{flexDirection: 'row'}}>
                      <Octicons name='location' color={"#298a3d"} size={17} style={{marginBottom: 7,marginTop: 7, marginEnd: 3}}/>
                      <Text style={styles.subtitle}>Kandivali</Text>
                  </View>
                  <View style={{flexDirection: 'row'}}>
                      <FontAwesome5 name='rupee-sign' color={"#298a3d"} size={30} style={{marginBottom: 7,marginTop: 7, marginEnd: 3}}/>
                      <Text style={styles.price}>1600</Text>
                  </View>
              </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.card,styles.elevation]}
                            onPress={() => (navigation.navigate('Turf4Description'))}>
              <Image source={require("../assets/turf4.png")} style={{height: 150, width: 150,borderRadius: 5,marginEnd: 10}} />
              <View style={{flexDirection: 'column'}}>
                  <Text style={styles.heading}>Turf 4</Text>
                  <View style={{flexDirection: 'row'}}>
                      <Octicons name='location' color={"#298a3d"} size={17} style={{marginBottom: 7,marginTop: 7, marginEnd: 3}}/>
                      <Text style={styles.subtitle}>Vile Parle</Text>
                  </View>
                  <View style={{flexDirection: 'row'}}>
                      <FontAwesome5 name='rupee-sign' color={"#298a3d"} size={30} style={{marginBottom: 7,marginTop: 7, marginEnd: 3}}/>
                      <Text style={styles.price}>600</Text>
                  </View>
              </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.card,styles.elevation]}
                            onPress={() => (navigation.navigate('Turf5Description'))}>
              <Image source={require("../assets/turf5.png")} style={{height: 150, width: 150,borderRadius: 5,marginEnd: 10}} />
              <View style={{flexDirection: 'column'}}>
                  <Text style={styles.heading}>Turf 5</Text>
                  <View style={{flexDirection: 'row'}}>
                      <Octicons name='location' color={"#298a3d"} size={17} style={{marginBottom: 7,marginTop: 7, marginEnd: 3}}/>
                      <Text style={styles.subtitle}>Andheri</Text>
                  </View>
                  <View style={{flexDirection: 'row'}}>
                      <FontAwesome5 name='rupee-sign' color={"#298a3d"} size={30} style={{marginBottom: 7,marginTop: 7, marginEnd: 3}}/>
                      <Text style={styles.price}>2000</Text>
                  </View>
              </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
  )
}

export default HomeScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,

    alignItems: 'center'
  },
    heading: {
        fontSize: 30,
        fontWeight: '600',
        marginBottom: 7,
        marginTop: 7,
    },
    subtitle: {
        fontSize: 15 ,
        fontWeight: '400',
        marginBottom: 7,
        marginTop: 7,
    },
    price: {
        fontSize: 35,
        fontWeight: '400',
        marginBottom: 7,

    },
    card: {
        backgroundColor: 'white',
        borderRadius: 8,
        paddingVertical: 5,
        paddingHorizontal: 5,
        width: '95%',
        marginVertical: 10,
        flexDirection: 'row',
    },
    elevation: {
        elevation: 20,
        shadowColor: '#52006A',
    },
})
