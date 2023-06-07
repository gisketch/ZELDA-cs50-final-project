// async function sendAudioToWhisper(audioBlob) {

    //   const file = new File([audioBlob], 'recording.mp3', { type: 'audio/mpeg' }); // create new File object
    
    //   console.log(file);
    
    //   const formData = new FormData();
    //   formData.append('file', URL.createObjectURL(file));
    //   formData.append('model', 'whisper-1');
    
    //   console.log(URL.createObjectURL(file));
    
    //   fetch('https://api.openai.com/v1/audio/transcriptions', {
    //     method: 'POST',
    //     headers: {
    //       'Authorization': 'Bearer ' + configuration.apiKey,
    //     },
    //     body: formData
    //   })
    //   .then(response => response.json())
    //   .then(data => console.log(data))
    //   .catch(error => console.error(error));
    
    //   // const resp = await openai.createTranscription(
    //   //   file, "whisper-1"
    //   // );
    
    //   // console.log(resp);
    
    // }


// //RECORDER VARIABLES
  // const [audioStream, setAudioStream] = useState(null);
  // const [recorder, setRecorder] = useState(null);
  // const [isRecording, setIsRecording] = useState(false);
  // const [audioObject, setAudioObject] = useState(null);

  // const handleStartRecording = () => {
  //   navigator.mediaDevices.getUserMedia({ audio: true })
  //     .then(stream => {
  //       setAudioStream(stream);
  //       const mediaRecorder = new MediaRecorder(stream);
  //       setRecorder(mediaRecorder);

  //       mediaRecorder.start();
  //       setIsRecording(true);

  //       const chunks = [];
  //       mediaRecorder.addEventListener("dataavailable", event => {
  //         chunks.push(event.data);
  //       });

  //       mediaRecorder.addEventListener("stop", () => {
  //         const blob = new Blob(chunks, { type: "audio/mpeg" });
  //         sendAudioToWhisper(blob);
  //         const file = new File([blob], 'recording.mp3', { type: 'audio/mpeg' });
  //         setAudioObject(URL.createObjectURL(file));
  //       });


  //     });
  // };

  // const handleStopRecording = () => {
  //   recorder.stop();
  //   setIsRecording(false);
  //   setAudioStream(null);
  // };