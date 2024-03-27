import styled from "styled-components";

export const Background = styled.div`
    background: 
        radial-gradient(
            30.97% 85.07% at 76.84% 37.7%,
            #1C3131 0%, 
            rgba(33, 65, 65, 0) 100%
        ), 
        radial-gradient(
             47.85% 46.43% at 10.14% -10.99%, 
             #1B2916 0%, 
             rgba(43, 62, 36, 0) 100%
         ), 
        radial-gradient(
            36.9% 48.16% at 28.58% 44.54%,
            #18271F 0%,
            rgba(27, 46, 35, 0) 100%
        ), 
        #000000;
    // height: 100vh;
    flex: 1;
    justify-content: center;

`;
export const TextContainer = styled.div`
    font-size: 20px;
    font-weight: 550;
    color: white;
    padding: 10px 0 0 10px;
`
export const MessageContainer = styled.div`
    flex: 1;
    justify-content: center;
    max-width: 100%;
`
export const ChatInputBox = styled.div`
    display: flex;
    max-width: 93%;
    margin: 150px
`;

export const HomeContainer = {
    flex: 1,
    justifyContent: 'center',
    height: '100%',
}
export const TITLE_BG_COLOR = 'rgba(17, 25, 25, 85)'





// export const BG_COLOR = '#32503c'
export const BG_COLOR = `#32503c`
export const CHAT_BGN = '#69786e'
export const BTN_COLOR = '#aaa'
export const BTN_CAPTION = '#555'
export const INPUT_BG_COLOR = '#69786e'
export const INPUT_COLOR = '#ddd'