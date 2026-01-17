// assets/Register.style.js
import { StyleSheet } from 'react-native';

export const registerStyle = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 60, 
    padding: 0,          
  borderWidth: 0,  
  },

   card: {
  backgroundColor: 'transparent', 
  elevation: 0,        
  borderRadius: 0,         
  borderWidth: 0,                 
},



  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // icon left, title center-ish
    marginBottom: 30,
  },

  pageTitle: {
  fontSize: 22,
  fontWeight: 'bold',
  textAlign: 'center',
  marginBottom: 20,
},


  hamburgerButton: {
    marginLeft: -10, 
    paddingTop:10
  },

  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 28, // ✅ balances space for the icon
  },

  input: {
    marginBottom: 16,
  },

  button: {
    marginTop: 8,
  },

  uploadLabel: {
    marginVertical: 12,
    color: '#333',
  },
});

export default registerStyle;