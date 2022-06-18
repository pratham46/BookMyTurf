import { useNavigation } from '@react-navigation/core'
import React, {useState} from 'react'
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import { auth } from '../firebase'
import Octicons from "react-native-vector-icons/Octicons";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import Ionicons from "react-native-vector-icons/Ionicons";
import Entypo from "react-native-vector-icons/Entypo";
import {Dropdown} from "react-native-element-dropdown";
import AntDesign from "react-native-vector-icons/AntDesign";

const data = [
    { label: '1:00pm-3:00pm', value: '1' },
    { label: '3:00pm-5:00pm', value: '2' },
    { label: '6:00pm-8:00pm', value: '3' },
    { label: '9:00pm-11:00pm', value: '4' },
];

const data1 = [
    { label: 'FootBall', value: '1' },
    { label: 'Cricket', value: '2' },
    { label: 'BasketBall', value: '3' },
];




export default function TurfBookingDetailsScreen2({navigation}){

        const [value, setValue] = useState(null);
        const [isFocus, setIsFocus] = useState(false);
        const [value1, setValue1] = useState(null);
        const [isFocus1, setIsFocus1] = useState(false);

    const renderLabel = () => {
        if (value || isFocus) {
            return (
                <Text style={[styles.label, isFocus && { color: 'blue' }]}>
                    Dropdown label
                </Text>
            );
        }
        return null;
    };

    const renderLabel1 = () => {
        if (value1 || isFocus1) {
            return (
                <Text style={[styles.label, isFocus1 && { color: 'blue' }]}>
                    Dropdown label
                </Text>
            );
        }
        return null;
    };

    return (
        <>
            <View style={styles.container}>
                <Text style={styles.heading}>Turf 2</Text>
                <View style={[styles.card,styles.elevation]}>
                    <Image source={require('../assets/turf2.png')} style={styles.image}/>
                </View>
                <Text style={styles.subheading}>Select Time Slot:</Text>
                <Dropdown
                    style={[styles.dropdown, isFocus1 && { borderColor: 'blue' }]}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    iconStyle={styles.iconStyle}
                    data={data}
                    search
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder={!isFocus ? 'Select Time Slot' : '...'}
                    searchPlaceholder="Search..."
                    value={value}
                    onFocus={() => setIsFocus(true)}
                    onBlur={() => setIsFocus(false)}
                    onChange={item => {
                        setValue(item.value);
                        setIsFocus(false);
                    }}
                    renderLeftIcon={() => (
                        <AntDesign
                            style={styles.icon}
                            color={isFocus ? 'blue' : 'black'}
                            name="Safety"
                            size={20}
                        />
                    )}
                />
                <Text style={styles.subheading}>Select Sport:</Text>
                <Dropdown
                    style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    iconStyle={styles.iconStyle}
                    data={data1}
                    search
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder={!isFocus1 ? 'Select Sport' : '...'}
                    searchPlaceholder="Search..."
                    value={value1}
                    onFocus={() => setIsFocus1(true)}
                    onBlur={() => setIsFocus1(false)}
                    onChange={item => {
                        setValue1(item.value1);
                        setIsFocus1(false);
                    }}
                    renderLeftIcon={() => (
                        <AntDesign
                            style={styles.icon}
                            color={isFocus1 ? 'blue' : 'black'}
                            name="Safety"
                            size={20}
                        />
                    )}
                />
                <TouchableOpacity
                    onPress={() => (console.log('Pressed'))}
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
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 10,
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
    container1: {
        backgroundColor: 'white',
        padding: 16,
    },
    dropdown: {
        height: 50,
        borderColor: 'gray',
        borderWidth: 0.5,
        borderRadius: 8,
        paddingHorizontal: 8,
        marginBottom: 10,
    },
    icon: {
        marginRight: 5,
    },
    label: {
        position: 'absolute',
        backgroundColor: 'white',
        left: 22,
        top: 8,
        zIndex: 999,
        paddingHorizontal: 8,
        fontSize: 14,
    },
    placeholderStyle: {
        fontSize: 16,
    },
    selectedTextStyle: {
        fontSize: 16,
    },
    iconStyle: {
        width: 20,
        height: 20,
    },
    inputSearchStyle: {
        height: 40,
        fontSize: 16,
    },
})
