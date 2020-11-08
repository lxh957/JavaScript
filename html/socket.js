import store from '../store'
import domain from '../utils/domain'

let socket

function connectSocket() {
    closeSocket()
    initSocket()

    socket.onopen = function () {
        if (socket.readyState !== 0) {
            // 0 === WebSocket.CONNECTING
            send('subscribe')
        }
    }

    socket.onmessage = function (event) {
        const data = JSON.parse(event.data)
        const auth = {
            token: store.state.user.token,
            user_id: store.state.user.user_id,
            unique_string: store.state.user.unique_string
        }

        switch (data.type || data.message.type) {
            case 'info':
                store.commit('user/SET', data)
                break
            case 'audio':
                if (data.message.data.data.user.id === store.state.user.user_id) return
                store.commit('messages/RECEIVE_MESSAGE_LATEST', data.message.data)
                break
            case 'image':
                if (data.message.data.data.user.id === store.state.user.user_id) return
                store.commit('messages/RECEIVE_MESSAGE_LATEST', data.message.data)
                break
            case 'text':
                if (data.message.data.data.user.id === store.state.user.user_id) return
                store.commit('messages/RECEIVE_MESSAGE_LATEST', data.message.data)
                break
            case 'user_information':
                store.dispatch('user/setUserInfo', data.message.data)
                break
            case 'settings':
                store.commit('settings/SET', data.message.data)
                break
            case 'confirm_subscription':
                store.commit('app/SET', { websocketConnected: true })
                send('message', { action: 'get_settings', ...auth })
                send('message', { action: 'get_user_information', ...auth })
                break
        }
    }
}

function initSocket() {
    const token = store.state.user.token
    socket = new WebSocket(`${domain.wssDomain}/cable?token=${token}`)
}

function closeSocket() {
    store.commit('app/SET', { websocketConnected: false })
    socket && socket.close()
}

function socketStatus() {
    return socket && socket.readyState
}

function send(command, _data) {
    const payload = {
        command,
        identifier: JSON.stringify({
            channel: 'ChatroomChannel',
            unique_string: store.state.user.unique_string
        })
    }

    if (_data) {
        const { type, ...data } = _data
        payload.data = JSON.stringify(data)
    }

    socket.send(JSON.stringify(payload))
}

export { connectSocket, closeSocket, socketStatus }