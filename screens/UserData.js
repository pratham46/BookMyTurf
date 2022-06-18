import { useNavigation } from '@react-navigation/native'
import React, {useState} from 'react'
import {Image, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native'
import { auth } from '../firebase'
import firebase from "firebase";

const UserForm = () => {
    const navigation = useNavigation()

    const [name, setname] = useState('')
    const [email, setEmail] = useState('')
    const [contact, setcontact] = useState('')
    const [location, setlocation] = useState('')

    return (
        <View
            style={styles.container}
            behavior="padding"
        >
            <View style={styles.inputContainer}>
                <Text style={styles.text}>Name:</Text>
                <TextInput
                    placeholder="User"
                    value={name}
                    onChangeText={text => setname(text)}
                    style={styles.input}
                />
                <Text style={styles.text}>Email:</Text>
                <TextInput
                    placeholder="Example@user.com"
                    value={email}
                    onChangeText={text1 => setEmail(text1)}
                    style={styles.input}
                />
                <Text style={styles.text}>Contact No:</Text>
                <TextInput
                    placeholder="+91 XXXXX XXXXX"
                    value={contact}
                    onChangeText={text2 => setcontact(text2)}
                    style={styles.input}
                />
                <Text style={styles.text}>Location:</Text>
                <TextInput
                    placeholder="Mumbai"
                    value={location}
                    onChangeText={text => setlocation(text)}
                    style={styles.input}
                />
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    onPress={console.log('Pressed')}
                    style={styles.button}
                >
                    <Text style={styles.buttonText}>Submit</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default UserForm

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#cccccc',

        alignItems: 'center',
    },
    inputContainer: {
        width: '80%'
    },
    input: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 10,
        marginTop: 5,
        backgroundColor: 'white',
        width: '95%',
        marginVertical: 10,
        elevation: 20,
        shadowColor: 'rgba(63,63,63,0.8)',
    },
    buttonContainer: {
        width: '60%',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
    },
    button: {
        backgroundColor: '#298a3d',
        width: '100%',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
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
    text: {
        marginLeft: 10,
        marginTop: 20,
        color: '#2f2f2f',
        fontWeight: "700",
        fontSize: 15,
    },
    image: {
        width: 300,
        height: 200,
        left: 15,
    },
})
