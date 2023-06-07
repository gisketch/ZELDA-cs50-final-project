import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import './App.css'

import ScrollContainer from 'react-indiana-drag-scroll'

import 'regenerator-runtime'
import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition'
import { createSpeechlySpeechRecognition } from '@speechly/speech-recognition-polyfill'
import Polly from './tools/Polly'
// const appId = '0c2b5012-c2d6-42e6-b97d-70474bfa2ed0';
// const SpeechlySpeechRecognition = createSpeechlySpeechRecognition(appId);
// SpeechRecognition.applyPolyfill(SpeechlySpeechRecognition);

// ? ICON IMPORTS * //
import {
  FaMicrophone,
  FaStop,
  FaCalculator,
  FaComment,
  FaHistory,
  FaUndo,
  FaBackspace,
  FaCheck,
} from 'react-icons/fa'

// ? Module Imports * //
import 'axios'
import { v4 as uuid } from 'uuid'
import 'katex/dist/katex.min.css'
import Latex from 'react-latex-next'

// ? Prompt * //

import corePrompt from './CorePrompt'

// ? OpenAI configurations * //

import dotenv from 'dotenv'
dotenv.config()

import { Configuration, OpenAIApi } from 'openai'
const configuration = new Configuration({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
})

const openai = new OpenAIApi(configuration)

function App() {
  //USER VARIABLES
  const [name, setName] = useState('') // name of the user
  //INTERFACE VARIABLES
  const [conversation, setConversation] = useState([]) // conversation between the user and zelda
  const [isFirstTime, setIsFirstTime] = useState(true) // is it the first time the user is using the app?
  const [isInitialized, setIsInitialized] = useState(false)
  const [zeldaState, setZeldaState] = useState(0)
  const [generatingResponse, setGeneratingResponse] = useState(false)
  const [currentAnswer, setCurrentAnswer] = useState({
    title: null,
    problem: null,
    solution: null,
    latex: null,
  })
  const [answerDatabase, setAnswerDatabase] = useState([])
  //PROMPT VARIABLES
  const [promptMemory, setPromptMemory] = useState(``)
  const [showingHistory, setShowingHistory] = useState(false)
  const [fromHistory, setFromHistory] = useState(false)
  const [currentResponse, setCurrentResponse] = useState('')

  const [isInternetFast, setIsInternetFast] = useState(true)

  const [appState, setAppState] = useState(0)

  // SPEECH RECOGNITION VARIABLES
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition()

  // * First time Launch * //

  const isFirstMount = useRef(true)

  useEffect(() => {
    //   if (isFirstMount.current) {
    //   isFirstMount.current = false;
    //   if(isFirstTime) {
    //     setIsFirstTime(false);
    //     setGeneratingResponse(true);
    //     // addToConversation("Zelda", "Hello, I'm Zelda. What can I do for you today?");
    //     // zeldaTalk("Hello, I'm Zelda. What can I do for you today?");
    //     getZeldaResponse("You've just booted. Make a short greeting to the user (me).");
    //   }
    // }

    if (isInitialized && !listening) {
      // Call your function here
      console.log('stopping speech')
      stopSpeech()
      setIsInitialized(false)
    }
  }, [listening])

  // **************** //
  // *FUNCTIONS BLOCK //
  // **************** //

  const handleConfirmName = () => {
    setGeneratingResponse(true)
    // addToConversation("Zelda", "Hello, I'm Zelda. What can I do for you today?");
    // zeldaTalk("Hello, I'm Zelda. What can I do for you today?");
    getZeldaResponse(`You've just booted. Make a short greeting to ${name}.`)
    //
  }

  const handleAddName = (char) => {
    if (name.length < 14) {
      setName(name + char)
    } else {
      setName(name.slice(0, 14))
    }
  }

  const getZeldaResponse = async (prompt) => {
    await openai
      .createCompletion({
        model: 'text-davinci-003',
        max_tokens: 1000,
        prompt:
          corePrompt(name) + promptMemory + '\nHuman: ' + prompt + '\nZelda:',
      })
      .then((data) => {
        try {
          const response = JSON.parse(data.data.choices[0].text)

          console.log(data.data.choices[0].text)

          setCurrentResponse(response.response)
          addToConversation('Zelda', response.response)
          setGeneratingResponse(false)

          setPromptMemory(
            promptMemory +
              '\nHuman: ' +
              prompt +
              '\nZelda:' +
              JSON.stringify(response)
          )

          if (
            response.latex !== undefined ||
            response.title !== undefined ||
            response.solution !== undefined
          ) {
            zeldaTalk(response.response + '. ' + response.solution)
            setCurrentAnswer({
              title: response.title,
              problem: prompt,
              solution: response.solution,
              latex: response.latex,
            })
          } else {
            zeldaTalk(response.response)
          }
        } catch (error) {
          console.log(error)
          addToConversation(
            prompt,
            "I'm sorry, I didn't understand that. Can you try again?"
          )
          setCurrentResponse(
            "I'm sorry, I didn't understand that. Can you try again?"
          )
          zeldaTalk("I'm sorry, I didn't understand that. Can you try again?")
          setGeneratingResponse(false)
        }
      })
  }

  const fixPunctuation = async (text) => {
    try {
      const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a punctuation and grammar fixer. You will receive a transcription from a user and your goal is to fix that input (because mic could pick up something wrong) into a better readable format (math based). Only respond with a JSON object. If you have any comments, add a key to the object and respond there. //{"output":"<<text>>", "comment":"<<comment>>"} If the user is being offensive (saying rated 18+ words). Censor the offensive words with [CENSORED] instead. If you don't understand the transcription. Just fix it anyways. You do not need to respond. Do not add anything to the transcription. `,
          },
          { role: 'user', content: `hello zelda` },
          {
            role: 'assistant',
            content: `{"transcribed":"Hello, Zelda!", "botreply":"Hello Human!"}`,
          },
          { role: 'user', content: `how are you` },
          {
            role: 'assistant',
            content: `{"transcribed":"How are you?", "botreply":"I'm doing well. How are you?"}`,
          },
          { role: 'user', content: `who made you` },
          {
            role: 'assistant',
            content: `{"transcribed":"Who made you?", "botreply":"I was created by a team of developers."}`,
          },
          { role: 'user', content: `who created you` },
          {
            role: 'assistant',
            content: `{"transcribed":"Who created you?", "botreply":"I was created by a team of developers."}`,
          },
          { role: 'user', content: `can you convert all the previous dialog` },
          {
            role: 'assistant',
            content: `{"transcribed":"Can you convert all the previous dialogs?"}`,
          },
          { role: 'user', content: `whats one plus one to the fifth power` },
          { role: 'assistant', content: `{"transcribed":"What's (1 + 1)^5?"}` },
          { role: 'user', content: `one plus one` },
          { role: 'assistant', content: `{"transcribed":"1 + 1"` },
          { role: 'user', content: `argue he returned` },
          {
            role: 'assistant',
            content: `{"transcribed":"Argue. He returned.", "comment":"I'm sorry, I don't understand what you mean by that"}`,
          },
          { role: 'user', content: `in the accomodating` },
          {
            role: 'assistant',
            content: `{"transcribed":"In the accomodating.", "comment":"I'm sorry, I don't understand what you mean by that"}`,
          },
          { role: 'user', content: text },
        ],
      })
      const response = JSON.parse(completion.data.choices[0].message.content)
      return response.transcribed
    } catch (error) {
      console.log(error)
      return text
    }
  }

  const zeldaTalk = (zeldaText) => {
    // add Zelda to conversation
    // speak the text
    setZeldaState(2)
    if (isInternetFast) {
      Polly(zeldaText, () => {
        setZeldaState(0)
      })
    } else {
      //add a delay of 2 seconds
      setTimeout(() => {
        setZeldaState(0)
      }, 2000)
    }
  }

  const addToConversation = (speaker, text) => {
    // add Zelda to conversation
    const dialog = {
      id: uuid(),
      speaker: speaker,
      text: text,
    }
    setConversation((prevConversation) => [...prevConversation, dialog])

    //if conversation is more than 4, remove the first one
    if (conversation.length > 7) {
      setConversation((prevConversation) => prevConversation.slice(1))
    }
  }

  const recordSpeech = () => {
    // record the user's speech
    setIsInitialized(true)
    setZeldaState(3)
    SpeechRecognition.startListening()
    console.log('listening...')
  }

  const stopSpeech = async () => {
    // stop recording the user's speech
    if (!generatingResponse) {
      SpeechRecognition.stopListening()
      setZeldaState(1)
      let message = transcript
      if (transcript === '') {
        message = '...'
        addToConversation('User', message)
        setGeneratingResponse(true)
        getZeldaResponse(message)
        resetTranscript()
      } else {
        // addToConversation("User", transcript);
        // getZeldaResponse(transcript);
        // const fixedMessage = await fixPunctuation(message);
        const fixedMessage = message
        addToConversation('User', fixedMessage)
        getZeldaResponse(fixedMessage)
        setGeneratingResponse(true)
        resetTranscript()
      }
    }
  }

  const saveAnswer = () => {
    // save the answer to the database
    setAnswerDatabase((prevAnswerDatabase) => [
      ...prevAnswerDatabase,
      currentAnswer,
    ])
    setCurrentAnswer({
      title: null,
      problem: null,
      solution: null,
      latex: null,
    })
    console.log(answerDatabase)
  }

  const clearAnswer = () => {
    setCurrentAnswer({
      title: null,
      problem: null,
      solution: null,
      latex: null,
    })
  }

  const respond = () => {
    saveAnswer()
    recordSpeech()
  }

  const explain = () => {
    saveAnswer()
    setZeldaState(1)
    addToConversation('User', 'Can you explain?')
    setGeneratingResponse(true)
    getZeldaResponse('Can you explain?')
  }

  // **************** //
  // *RENDER FUNCTION //
  // **************** //

  let firstRow = name.length < 1 ? 'QWERTYUIOP' : 'qwertyuiop'
  let secondRow = name.length < 1 ? 'ASDFGHJKL' : 'asdfghjkl'
  let lastRow = name.length < 1 ? 'ZXCVBNM' : 'zxcvbnm'

  return (
    <div className="AppContainer">
      <motion.div
        className="Intro"
        animate={{
          scale: appState === 0 ? 1 : 0,
        }}
      >
        <motion.div
          className="AskName"
          initial={{
            opacity: 0,
            y: -100,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
          }}
        >
          What's your name?
        </motion.div>
        <div className="NameInputContainer">
          <motion.div
            className={name !== '' ? 'NameInput' : 'NameInput PlaceholderName'}
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              delay: 0.8,
            }}
          >
            {name === '' ? 'Link' : name}
          </motion.div>

          <motion.button
            className="NameCheck"
            whileTap={{
              scale: 0.9,
            }}
            onClick={() => {
              if (name.length > 0) {
                setAppState(1)
                handleConfirmName()
              }
            }}
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              delay: 1,
            }}
          >
            <FaCheck color="00ffea" />
          </motion.button>
        </div>
        <motion.div
          className="Keyboard"
          initial={{
            scale: 0,
          }}
          animate={{
            scale: 1,
          }}
          transition={{
            delay: 0.4,
          }}
        >
          <div className="FirstRow">
            {firstRow.split('').map((letter) => (
              <motion.button
                className="Letter"
                onClick={() => handleAddName(letter)}
                whileTap={{
                  scale: 0.9,
                }}
              >
                {letter}
              </motion.button>
            ))}
          </div>
          <div className="SecondRow">
            {secondRow.split('').map((letter) => (
              <motion.button
                className="Letter"
                onClick={() => handleAddName(letter)}
                whileTap={{
                  scale: 0.9,
                }}
              >
                {letter}
              </motion.button>
            ))}
          </div>
          <div className="LastRow">
            {lastRow.split('').map((letter) => (
              <motion.button
                className="Letter"
                onClick={() => handleAddName(letter)}
                whileTap={{
                  scale: 0.9,
                }}
              >
                {letter}
              </motion.button>
            ))}

            <motion.button
              className="Backspace"
              style={{
                width: '5rem',
              }}
              onClick={() => setName(name.slice(0, -1))}
              whileTap={{
                scale: 0.9,
              }}
            >
              <FaBackspace color="00ff80" />
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        className="App"
        animate={{
          scale: appState === 1 ? 1 : 0,
        }}
      >
        <div className="Background"></div>

        <div className="TopShadow"></div>

        {/* <motion.div
          className="NamePrompt"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1 }}
        >
          <h1>What's your name?</h1>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </motion.div> */}

        <motion.div
          className="ZeldaContainer"
          animate={{
            x: currentAnswer.title !== null || showingHistory ? -50 : 0,
            scale: currentAnswer.title || showingHistory ? 0.8 : 1,
          }}
        >
          <motion.div className="Zelda">
            <motion.img
              className="ZeldaImage"
              src={(() => {
                switch (zeldaState) {
                  case 0:
                    return Math.random() < 0.5
                      ? './src/assets/img/idle_loop.gif'
                      : './src/assets/img/idle_loop2.gif'
                  case 1:
                    return './src/assets/img/thinking_loop.gif'

                    break
                  case 2:
                    return './src/assets/img/talking_loop.gif'
                  case 3:
                    return './src/assets/img/listen_loop.gif'
                  default:
                    return './src/assets/img/idle_loop.gif'
                }
              })()}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            />
          </motion.div>
        </motion.div>

        <motion.div
          className="DialogContainer"
          animate={{
            x: currentAnswer.title === null && !showingHistory ? 0 : 700,
          }}
        >
          <div className="Dialogs">
            {
              // userConversation.map((userText, index) => {
              //   return (
              //     <div>
              //       <div className="UserDialog" key={`user-${index}`}>
              //         {userText}
              //       </div>
              //       <div className="ZeldaDialog" key={`zelda-${index}`}>
              //         {zeldaConversation[index]}
              //       </div>
              //     </div>
              //   )
              // }
              // )
              conversation.map((text) => {
                return (
                  <motion.div
                    className={
                      text.speaker === 'User' ? 'UserDialog' : 'ZeldaDialog'
                    }
                    key={`${text.id}`}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {text.text}
                  </motion.div>
                )
              })
            }
            <motion.div
              className="ResponseAnimationContainer"
              animate={{
                scale: generatingResponse ? 1 : 0,
              }}
            >
              <img
                className="ResponseAnimation"
                src="./src/assets/img/response-generating.gif"
              />
            </motion.div>
          </div>

          {/* User Record Button */}
          <div className="RecordButtonContainer">
            <motion.div
              className="Transcript"
              animate={{
                width: listening ? '100%' : '0%',
              }}
            >
              <motion.img
                src="./src/assets/img/recordingAnim.gif"
                animate={{
                  scale: listening ? 1 : 0,
                }}
                transition={{ delay: 0.5 }}
              />
              {listening ? transcript : ''}
            </motion.div>

            <motion.button
              className="RecordButton"
              animate={{
                background: listening
                  ? 'linear-gradient(90deg, #FF33B8 0%, #FD778C 100%)'
                  : 'linear-gradient(90deg, #704CFE 0%, #9074FE 100%)',
                boxShadow: listening
                  ? '0 0 1.5rem #FD778C'
                  : '0 0 0.5rem #9074FE',
              }}
              whileTap={{ scale: 0.9, rotate: 360 }}
              onClick={() => {
                if (!listening) {
                  recordSpeech()
                } else {
                  stopSpeech()
                }
              }}
            >
              {listening ? <FaStop /> : <FaMicrophone />}
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          className="SolutionContainer"
          animate={{
            x: currentAnswer.title === null ? 700 : 0,
            scale: 0.95,
          }}
        >
          <div className="Solution">
            <motion.div
              className="SolutionHeader"
              animate={{
                x: currentAnswer.title === null ? 50 : 0,
                opacity: currentAnswer.title === null ? 0 : 1,
              }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <FaCalculator color="#00eeff" />
              {currentAnswer.title === '' ? (
                ''
              ) : (
                <p style={{ marginLeft: '1rem' }}>{currentAnswer.title}</p>
              )}
            </motion.div>

            <div className="SolutionDescription">
              <motion.p
                className="Problem"
                animate={{
                  x: currentAnswer.title === null ? 100 : 0,
                  opacity: currentAnswer.title === null ? 0 : 1,
                }}
                transition={{ delay: 0.75, duration: 0.5 }}
              >
                <b>Problem:</b> {currentAnswer.problem}
              </motion.p>

              <motion.p
                className="Answer"
                animate={{
                  x: currentAnswer.title === null ? 150 : 0,
                  opacity: currentAnswer.title === null ? 0 : 1,
                }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <b>Solution:</b>{' '}
                {(currentAnswer.solution === '') === null
                  ? ''
                  : currentAnswer.solution}
              </motion.p>
            </div>
            <motion.div
              className="LatexContainer"
              animate={{
                scale: currentAnswer.title === null ? 0 : 1,
              }}
              transition={{ delay: 1.5 }}
            >
              {currentAnswer.title === null ? (
                ''
              ) : (
                <Latex>{currentAnswer.latex}</Latex>
              )}
            </motion.div>
            {fromHistory ? (
              <div className="SolutionButtons">
                <motion.button
                  className="ExplainButton"
                  style={{
                    background:
                      'linear-gradient(90deg, #FF33B8 0%, #FD778C 100%)',
                    boxShadow: '0 0 0.5rem #FF33B8',
                  }}
                  animate={{
                    y: currentAnswer.title === null ? 50 : 0,
                    opacity: currentAnswer.title === null ? 0 : 1,
                  }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    clearAnswer()
                    setFromHistory(false)
                    setShowingHistory(true)
                  }}
                >
                  <FaHistory />
                  <p style={{ marginLeft: '1rem' }}>History</p>
                </motion.button>
                <motion.button
                  className="RespondButton"
                  style={{
                    background:
                      'linear-gradient(90deg, #704CFE 0%, #9074FE 100%)',
                    boxShadow: '0 0 0.5rem #9074FE',
                  }}
                  animate={{
                    y: currentAnswer.title === null ? 50 : 0,
                    opacity: currentAnswer.title === null ? 0 : 1,
                  }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    clearAnswer()
                    setFromHistory(false)
                  }}
                >
                  <FaUndo />
                  <p style={{ marginLeft: '1rem' }}>Return</p>
                </motion.button>
              </div>
            ) : (
              //NOT FROM HISTORY
              <div className="SolutionButtons">
                <motion.button
                  className="ExplainButton"
                  style={{
                    background:
                      'linear-gradient(90deg, #FF33B8 0%, #FD778C 100%)',
                    boxShadow: '0 0 0.5rem #FF33B8',
                  }}
                  animate={{
                    y: currentAnswer.title === null ? 50 : 0,
                    opacity: currentAnswer.title === null ? 0 : 1,
                  }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    explain()
                  }}
                >
                  <FaComment />
                  <p style={{ marginLeft: '1rem' }}>Explain</p>
                </motion.button>
                <motion.button
                  className="RespondButton"
                  style={{
                    background:
                      'linear-gradient(90deg, #704CFE 0%, #9074FE 100%)',
                    boxShadow: '0 0 0.5rem #9074FE',
                  }}
                  animate={{
                    y: currentAnswer.title === null ? 50 : 0,
                    opacity: currentAnswer.title === null ? 0 : 1,
                  }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    respond()
                  }}
                >
                  <FaMicrophone />
                  <p style={{ marginLeft: '1rem' }}>Respond</p>
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          className="HistoryContainer"
          animate={{
            x: showingHistory === false ? 700 : 0,
            scale: 0.95,
          }}
        >
          <div className="History">
            <div className="HistoryHeader">
              <FaHistory color="#ffec81" />
              <p style={{ marginLeft: '1rem' }}>History</p>
            </div>
            <ScrollContainer className="HistoryList" hideScrollbars={true}>
              {answerDatabase.reverse().map((item, index) => {
                return (
                  <motion.button
                    className="HistoryItem"
                    animate={{
                      x: item.title === null ? 50 : 0,
                      opacity: item.title === null ? 0 : 1,
                    }}
                    // transition={{ delay: index * 0.1, duration: 0.5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setFromHistory(true)
                      setShowingHistory(false)
                      setCurrentAnswer(item)
                    }}
                  >
                    <div className="HistoryIndex">
                      {answerDatabase.length - index}
                    </div>
                    <p style={{ marginLeft: '2rem' }}>{item.title}</p>
                  </motion.button>
                )
              })}
            </ScrollContainer>
            <div className="HistoryButtons">
              <motion.button
                className="UndoButton"
                style={{
                  background:
                    'linear-gradient(90deg, #ffec81 0%, #ffae00 100%)',
                  boxShadow: '0 0 0.5rem #ffec81',
                }}
                animate={{}}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setShowingHistory(false)
                }}
              >
                <FaUndo />
                <p style={{ marginLeft: '1rem' }}>Return</p>
              </motion.button>
            </div>
          </div>
        </motion.div>

        <motion.button
          className="HistoryButton"
          animate={{
            x: !showingHistory && currentAnswer.title === null ? 0 : -50,
            opacity: !showingHistory && currentAnswer.title === null ? 1 : 0,
          }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setShowingHistory(true)
          }}
        >
          <FaHistory color="#ffffffaa" />
        </motion.button>
        {zeldaState === 2 || zeldaState === 1 ? (
          <div className="Blocker"></div>
        ) : (
          <div className="Blocker" style={{ display: 'none' }}></div>
        )}
      </motion.div>
    </div>
  )
}

export default App
