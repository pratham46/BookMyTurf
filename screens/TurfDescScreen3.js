import React from 'react'
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import Octicons from "react-native-vector-icons/Octicons";
import Ionicons from "react-native-vector-icons/Ionicons";
import Entypo from "react-native-vector-icons/Entypo";


export default function TurfDescScreen3({navigation}){
    return (
        <>
        <View style={styles.container}>
            <Text style={styles.heading}>Turf 3</Text>
            <View style={[styles.card,styles.elevation]}>
                <Image source={require('../assets/turf3.png')} style={styles.image}/>
            </View>
            <Text style={styles.subheading}>Available Games:</Text>
            <Text style={styles.subtitle}>•Cricket</Text>
            <Text style={styles.subtitle}>•Football</Text>
            <View style={{flexDirection: 'row', marginTop: 10}}>
                <Ionicons name='call' color={"#298a3d"} size={30} style={{marginBottom: 7,marginTop: 7, marginEnd: 3}}/>
                <Text style={styles.subtitle1}>+91 XXXXXXXXXX</Text>
            </View>
            <View style={{flexDirection: 'row', marginTop: 10}}>
                <Entypo name='location' color={"#298a3d"} size={30} style={{marginBottom: 7,marginTop: 7, marginEnd: 3}}/>
                <Text style={styles.subtitle1}>Address</Text>
                    <View style={{flexDirection: 'column', marginTop: 7}}>
                        <View style={{flexDirection: 'row', marginTop: 25, marginLeft: -70}}>
                            <Octicons name='location' color={"#298a3d"} size={25} style={{marginBottom: 7,marginTop: 7, marginEnd: 3}}/>
                            <Text style={styles.subtitle2}>Open in Map</Text>
                        </View>
                    </View>
            </View>
            <View style={{flexDirection: 'row', marginTop: 15}}>
                <Octicons name='share-android' color={"#298a3d"} size={30} style={{marginBottom: 3,marginTop: 7, marginEnd: 3}}/>
                <Text style={styles.subtitle1}>Share</Text>
            </View>
        </View>
        <View style={styles.buttonContainer}>
            <TouchableOpacity
                onPress={() => (navigation.navigate('Turf3Booking'))}
                style={styles.button}
            >
            <Text style={styles.buttonText}>Book Turf</Text>
            </TouchableOpacity>
        </View>
        </>
    );

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginLeft: 15,
    },
    heading: {
        fontSize: 30,
        fontWeight: 'bold',
        marginBottom: 7,
        marginTop: 7,
    },
    subheading: {
        fontSize: 30,
        fontWeight: '600',
        marginBottom: 3,
        marginTop: 7,
    },
    subtitle: {
        marginLeft: 5,
        fontSize: 15 ,
        fontWeight: '400',
        marginBottom: 3,
        marginTop: 3,
    },
    subtitle1: {
        marginLeft: 5,

        fontSize: 22 ,
        fontWeight: '600',
        marginBottom: 3,
        marginTop: 5,
    },
    subtitle2: {
        marginLeft: 5,

        fontSize: 17 ,
        fontWeight: '400',
        marginBottom: 3,
        marginTop: 5,
    },
    image: {
        height: 230,
        width: '100%',
        borderRadius: 8,
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
    buttonContainer: {
        width: '95%',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 9,
    },
    button: {
        backgroundColor: '#298a3d',
        width: '95%',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
    },
    buttonOutline: {
        backgroundColor: 'rgba(255, 255, 255, 0)',
        marginTop: 5,
        borderColor: '#298a3d',
        borderWidth: 2,
    },
    buttonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
    buttonOutlineText: {
        color: '#298a3d',
        fontWeight: '700',
        fontSize: 16,
    },
})
