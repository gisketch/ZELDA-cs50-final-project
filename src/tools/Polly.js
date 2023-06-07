import AWS from 'aws-sdk';


// Create an Polly client
const PollyClient = new AWS.Polly({
    signatureVersion: 'v4',
    region: 'us-east-1',
    secretAccessKey: 'eJ9hVv3JIfApFjE7cuUfXXR2SsxgZSFLBsfUfCI6',
    accessKeyId: 'AKIAR7GQDO7XCMU7B6T7'
})


const Polly = (input, onEnded = ()=>{return} ) => {
    let params = {
        'Text': input,
        'OutputFormat': 'mp3',
        'VoiceId': 'Emma',
        'Engine': 'neural'
    }

    PollyClient.synthesizeSpeech(params, (err, data) => {
        if (err) {
            console.log("ERROR!!");
            console.log(err.code)
        } else if (data) {
            const audio = data.AudioStream;
            var blob = new Blob([audio], { type: 'audio/mp3' });
            var url = window.URL.createObjectURL(blob)
            window.audio = new Audio();
            window.audio.src = url;
            window.audio.play();
            window.audio.onended = () => {
                onEnded();
                console.log("Audio has ended");
            }
        }
    })
}


export default Polly;