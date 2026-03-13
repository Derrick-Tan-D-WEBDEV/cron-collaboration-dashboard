#!/bin/bash

# Telegram Bot Setup Guide for OpenClaw Message Bridge
# Run this script to get setup instructions

echo "🤖 Setting up Telegram Message Bridge for OpenClaw Integration"
echo "============================================================"
echo ""

echo "STEP 1: Create Telegram Bot"
echo "📱 Open Telegram and message @BotFather"
echo "💬 Send: /newbot"
echo "📝 Choose a name: 'Your Cron Dashboard Bot'"  
echo "📝 Choose a username: 'your_cron_dashboard_bot'"
echo "🔑 BotFather will give you a token like: 123456789:ABCdefGHIjklMNOpqrSTUvwxyz"
echo ""

echo "STEP 2: Get Chat ID"
echo "💬 Send a message to your new bot"
echo "🌐 Visit: https://api.telegram.org/bot{YOUR_BOT_TOKEN}/getUpdates"
echo "🔍 Look for 'chat': {'id': 123456789} in the response"
echo ""

echo "STEP 3: Add OpenClaw to Telegram Group"
echo "👥 Create a Telegram group"  
echo "➕ Add your bot to the group"
echo "➕ Add the OpenClaw instance to the same group"
echo "🔧 Make both bots administrators"
echo ""

echo "STEP 4: Environment Variables"
echo "Add to your dashboard .env:"
echo "TELEGRAM_BOT_TOKEN=your_bot_token_here"
echo "OPENCLAW_CHAT_ID=your_chat_id_here"
echo ""

echo "STEP 5: Test Integration"
echo "🧪 Use the test endpoint to verify communication"
echo ""
echo "Ready to proceed? Copy the example code below!"