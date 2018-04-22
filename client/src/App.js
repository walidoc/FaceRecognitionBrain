import React, { Component } from 'react';
import Navigation from "./components/Navigation/Navigation";
import ImageLinkForm from "./components/ImageLinkForm/ImageLinkForm";
import FaceRecognition from "./components/FaceRecognition/FaceRecognition";
import Logo from "./components/Logo/Logo";
import Rank from "./components/Rank/Rank";
import Signin from "./components/Signin/Signin";
import Register from "./components/Register/Register";
import Particles from 'react-particles-js';
import './App.css';
import 'tachyons';
import Clarifai from 'clarifai';

// instantiate clarifai with my API key
const app = new Clarifai.App({
    apiKey: 'a716d318ec1d4db9bcdc27b016434f08'
});

const particlesOptions = {
    particles: {
        line_linked: {
            enable: true,
            distance: 150,
            color: '#ffffff',
            opacity: 1,
            width: 1
          },
        number: {
            value: 50,
            density: {
              enable: true,
              value_area: 800
            }
        }
    }
}


class App extends Component {
    constructor(){
        super();
        this.state = {
            input: '',
            imageUrl: '',
            box: {},
            route: 'signin',
            user: {
                id: '',
                name: '',
                email: '',
                entries: 0,
                joined: ''
            }
        }
    }

    loadUser = (userData) => {
        this.setState({
            user: {
                id: userData.id,
                name: userData.name,
                email: userData.email,
                entries: userData.entries,
                joined: userData.joined
            }
        })
    }

    calculateFaceLocation = (data) => {
        const clarifaiFace = data.outputs[0].data.regions[0].region_info.bounding_box;
        const image = document.getElementById('inputImage');
        const width = Number(image.width);
        const height = Number(image.height);
        return {
            leftCol: clarifaiFace.left_col * width,
            topRow: clarifaiFace.top_row * height,
            rightCol: width - (clarifaiFace.right_col * width),
            bottomRow: height - (clarifaiFace.bottom_row * height)
        }
    }

    displayFaceBox = (box) => {
        this.setState({box});
    }

    onInputChange = (event) => {
         this.setState({
             input: event.target.value
         })
    }

    onPictureSubmit = () => {
        
        this.setState({
            imageUrl: this.state.input
        })

        app.models.predict(Clarifai.FACE_DETECT_MODEL, this.state.input)
            .then( response => {
                if(response){
                    fetch('http://localhost:8080/api/image/', {
                        method: 'put',
                        headers: {'Content-Type':'application/json'},
                        body: JSON.stringify({
                            id: this.state.user.id
                        })
                    })
                    .then(res => res.json())
                    .then(count => {
                        // TODO : to fix the count in the future
                        this.setState(Object.assign(this.state.user, {entries: count}))
                    })
                }

                this.displayFaceBox(this.calculateFaceLocation(response))
            })
            .catch(err => console.log('err', err));
   }

    onRouteChange = (route) => {
        this.setState({route: route});
    }

    render() {
        const { route, box, imageUrl, user } = this.state;
        return (
            <div className="App">
                <Particles className='particles' 
                    params={particlesOptions}
                />
                
                {   route === 'home'
                    ?   <div>
                            <Navigation onSignout={() => this.onRouteChange('signin')}/>
                            <Logo />
                            <Rank name={user.name} entries={user.entries} />
                            <ImageLinkForm 
                                onInputChange={this.onInputChange} 
                                onPictureSubmit={this.onPictureSubmit} 
                            />
                            <FaceRecognition box={box} imageUrl={imageUrl} /> 
                        </div>
                    :   (   route === 'signin'
                            ?   <Signin loadUser={this.loadUser} onRouteChange={this.onRouteChange} /> 
                            :   <Register loadUser={this.loadUser} onRouteChange={this.onRouteChange} /> 
                        )
                     
                }
            </div>
        );
    }
}

export default App;