/*
Copyright 2019-present OmiseGO Pte Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

import { AddCircleOutline, ArrowDropDown, RemoveCircleOutline } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import { fetchClassicExitCost, fetchFastDepositCost, fetchFastExitCost, fetchL2FeeBalance } from 'actions/balanceAction';
import { removeToken, setTokenAmount } from 'actions/bridgeAction';
import { openModal } from 'actions/uiAction';
import BN from 'bignumber.js';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectBridgeType } from 'selectors/bridgeSelector';
import { selectLayer } from 'selectors/setupSelector';
import { logAmount, toWei_String } from 'util/amountConvert';
import { getCoinImage } from 'util/coinImage';
import { BRIDGE_TYPE } from 'util/constant';
import * as S from './TokenInput.styles';

function TokenInput({
  token,
  index,
  isFastBridge,
  tokenLen,
  switchBridgeType,
  addNewToken
}) {

  const bridgeType = useSelector(selectBridgeType());
  const layer = useSelector(selectLayer());

  const dispatch = useDispatch();

  const underZero = new BN(token.amount).lt(new BN(0))
  const overMax = new BN(token.amount).gt(new BN(token.balance))

  const amount = token.symbol === 'ETH' ?
    Number(logAmount(token.balance, token.decimals, 3)).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) :
    Number(logAmount(token.balance, token.decimals, 2)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const onInputChange = (amount) => {
    dispatch(setTokenAmount({
      index,
      amount,
      toWei_String: toWei_String(amount, token.decimals)
    }))
  }

  const deleteToken = (tokenIndex) => {
    dispatch(removeToken(tokenIndex));
  }
  
  const openTokenPicker = () => {
    dispatch(openModal('tokenPicker', null, null, index))
  }

  useEffect(() => {
    if (layer === 'L2') {
      if (bridgeType === BRIDGE_TYPE.CLASSIC_BRIDGE) {
        dispatch(fetchClassicExitCost(token.address));
      } else {
        dispatch(fetchFastExitCost(token.address));
      }
      dispatch(fetchL2FeeBalance())
    } else {
      if (bridgeType === BRIDGE_TYPE.FAST_BRIDGE) {
        dispatch(fetchFastDepositCost(token.address))
      }
    }

  }, [ dispatch, layer, token, bridgeType ]);

  return (
    <S.TokenInputWrapper>
      <Box
        textAlign="right"
      >
        <Typography variant="body2">
          <Typography component="span" sx={{ opacity: 0.65 }}>
            Available Balance : &nbsp;
          </Typography>
          {amount}
        </Typography>
      </Box>
      <Box
        display="flex"
        justifyContent="space-around"
        alignItems="center"
        sx={{ gap: '5px' }}
      >
        <S.TokenPicker
          onClick={() => { openTokenPicker(index) }}
        >
          <img src={getCoinImage(token.symbol)} alt="logo" width={25} height={25} /> {token.symbol} <ArrowDropDown fontSize="medium" />
        </S.TokenPicker>
        <S.TextFieldWrapper>
          <S.TextFieldTag
            placeholder="enter amount"
            type="number"
            value={token.amount}
            onChange={(e) => {
              onInputChange(e.target.value);
            }}
            fullWidth={true}
            variant="standard"
            error={underZero || overMax}
          />
        </S.TextFieldWrapper>
        <S.TokenPickerAction>
          <IconButton size="small" aria-label="add token"
            onClick={() => {
              if (tokenLen === 1 && bridgeType === BRIDGE_TYPE.CLASSIC_BRIDGE) {
                switchBridgeType()
              } else {
                addNewToken()
              }
            }}
          >
            <AddCircleOutline fontSize="small" />
          </IconButton>
          <IconButton disabled={!isFastBridge && tokenLen <= 1} size="small" aria-label="remove token"
            onClick={() => {
              deleteToken(index);
            }}
          >
            <RemoveCircleOutline fontSize="small" />
          </IconButton>
        </S.TokenPickerAction>
      </Box>
      {token.amount !== '' && underZero ?
        <Typography variant="body3" sx={{ mt: 1 }}>
          Value too small: the value must be greater than 0
        </Typography>
        : null
      }
      {token.amount !== '' && overMax ?
        <Typography variant="body3" sx={{ mt: 1 }}>
          Value too large: the value must be smaller than {Number(token.balance).toFixed(3)}
        </Typography>
        : null}
    </S.TokenInputWrapper>
  )
}

export default React.memo(TokenInput)