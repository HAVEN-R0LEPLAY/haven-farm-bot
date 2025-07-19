const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// IMPORTANT: Your channel and role IDs
const PLACE_ORDER_CHANNEL_ID = '1395533358380875834'; // 👇𝙋𝙡𝙖𝙘𝙚-𝙖𝙣-𝙊𝙧𝙙𝙚𝙧👇
const OPENED_ORDERS_CATEGORY_ID = '1395902894431015083'; // Opened orders category
const ARCHIVED_ORDERS_CATEGORY_ID = '1395903020629496001'; // Archived Orders category
const EMPLOYEE_ROLE_ID = '1395533357542150156'; // employee role

// Function to automatically find the correct channel for orders
function findOrdersChannel(guild) {
    // Option 1: Find by channel name (most flexible)
    let ordersChannel = guild.channels.cache.find(channel => 
        channel.name.includes('order') && 
        channel.name.includes('place') && 
        channel.type === 0
    );
    
    // Option 2: If not found, try finding the place-order channel by ID
    if (!ordersChannel) {
        ordersChannel = guild.channels.cache.get(PLACE_ORDER_CHANNEL_ID);
    }
    
    // Option 3: If still not found, find any channel with "order" in the name
    if (!ordersChannel) {
        ordersChannel = guild.channels.cache.find(channel => 
            channel.name.toLowerCase().includes('order') && 
            channel.type === 0
        );
    }
    
    return ordersChannel;
}

// In-memory storage for items and cart messages
const farmItems = new Map();
const customerCarts = new Map();
const cartMessages = new Map(); // Store cart message references by userId

// Initialize with your farm items
farmItems.set('milk', { name: 'Milk', price: 15.00, unit: '1' });
farmItems.set('eggs', { name: 'Eggs', price: 1.00, unit: '1' });
farmItems.set('flour', { name: 'Flour', price: 9.00, unit: '1' });
farmItems.set('orange', { name: 'Orange', price: 3.00, unit: '1' });
farmItems.set('lemon', { name: 'Lemon', price: 3.00, unit: '1' });
farmItems.set('beefbroth', { name: 'Beef Broth', price: 9.00, unit: '1' });
farmItems.set('banana', { name: 'Banana', price: 9.00, unit: '1' });
farmItems.set('strawberry', { name: 'Strawberry', price: 9.00, unit: '1' });
farmItems.set('blueberry', { name: 'Blueberry', price: 15.00, unit: '1' });
farmItems.set('rice', { name: 'Rice', price: 12.00, unit: '1' });
farmItems.set('seaweed', { name: 'Seaweed', price: 9.00, unit: '1' });
farmItems.set('fish', { name: 'Fish', price: 30.00, unit: '1' });
farmItems.set('wheat', { name: 'Wheat', price: 18.00, unit: '1' });
farmItems.set('onion', { name: 'Onion', price: 6.00, unit: '1' });
farmItems.set('pork', { name: 'Pork', price: 6.00, unit: '1' });
farmItems.set('chicken', { name: 'Chicken', price: 2.00, unit: '1' });
farmItems.set('meat', { name: 'Meat', price: 30.00, unit: '1' });
farmItems.set('tomato', { name: 'Tomato', price: 3.00, unit: '1' });
farmItems.set('chickpeas', { name: 'Chickpeas', price: 5.00, unit: '1' });
farmItems.set('basil', { name: 'Basil', price: 9.00, unit: '1' });
farmItems.set('sugar', { name: 'Sugar', price: 12.00, unit: '1' });
farmItems.set('rose', { name: 'Rose', price: 2.50, unit: '1' });
farmItems.set('wine', { name: 'Wine', price: 21.00, unit: '1' });
farmItems.set('sake', { name: 'Sake', price: 21.00, unit: '1' });
farmItems.set('butter', { name: 'Butter', price: 15.00, unit: '1' });
farmItems.set('cheese', { name: 'Cheese', price: 6.00, unit: '1' });
farmItems.set('bread', { name: 'Bread', price: 9.00, unit: '1' });
farmItems.set('nori', { name: 'Nori', price: 9.00, unit: '1' });
farmItems.set('tofu', { name: 'Tofu', price: 6.00, unit: '1' });
farmItems.set('boba', { name: 'Boba', price: 15.00, unit: '1' });
farmItems.set('ham', { name: 'Ham', price: 9.00, unit: '1' });
farmItems.set('noodles', { name: 'Noodles', price: 1.50, unit: '1' });
farmItems.set('blacktea', { name: 'Black Tea', price: 12.00, unit: '1' });

client.once('ready', async () => {
    console.log(`Bot is ready! Logged in as ${client.user.tag}`);
    
    try {
        console.log('🚀 Registering commands...');
        await registerCommands();
        console.log('✅ All commands registered successfully!');
    } catch (error) {
        console.error('❌ Error with command registration:', error);
        console.log('⚠️ Bot will continue running, but commands may not work properly');
    }
});

async function registerCommands() {
    const commands = [
        new SlashCommandBuilder()
            .setName('add-item')
            .setDescription('Add a new farm item')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('Item name')
                    .setRequired(true))
            .addNumberOption(option =>
                option.setName('price')
                    .setDescription('Price per unit')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('unit')
                    .setDescription('Unit of measurement (lb, head, bunch, etc.)')
                    .setRequired(true)),
        
        new SlashCommandBuilder()
            .setName('remove-item')
            .setDescription('Remove an item from the farm')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('Item name to remove')
                    .setRequired(true)),
        
        new SlashCommandBuilder()
            .setName('setup-shop')
            .setDescription('Setup the shop welcome message in place-order channel')
    ];

    try {
        console.log('📝 Registering global commands...');
        await client.application.commands.set(commands);
        console.log('✅ Global commands registered successfully');
    } catch (error) {
        console.error('❌ Error registering commands:', error);
        throw error;
    }
}

client.on('interactionCreate', async interaction => {
    try {
        console.log(`Interaction received: ${interaction.type} - ${interaction.isCommand() ? interaction.commandName : interaction.customId}`);
        
        if (interaction.isCommand()) {
            await handleSlashCommand(interaction);
        } else if (interaction.isStringSelectMenu()) {
            await handleSelectMenu(interaction);
        } else if (interaction.isButton()) {
            await handleButton(interaction);
        } else if (interaction.isModalSubmit()) {
            await handleModal(interaction);
        }
    } catch (error) {
        console.error('Error in interactionCreate:', error);
        
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: 'An error occurred. Please try again.', 
                    flags: 64
                });
            }
        } catch (replyError) {
            console.error('Error sending error reply:', replyError);
        }
    }
});

async function handleSlashCommand(interaction) {
    const { commandName } = interaction;

    try {
        console.log(`Received command: ${commandName} from ${interaction.user.username}`);
        
        switch (commandName) {
            case 'add-item':
                await addItem(interaction);
                break;
            case 'remove-item':
                await removeItem(interaction);
                break;
            case 'setup-shop':
                await setupShopWelcome(interaction);
                break;
            default:
                console.log(`Unknown command: ${commandName}`);
                await interaction.reply({ 
                    content: `Unknown command: ${commandName}`, 
                    flags: 64
                });
                break;
        }
    } catch (error) {
        console.error(`Error handling command ${commandName}:`, error);
        
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: 'There was an error processing your command. Please try again.', 
                    flags: 64
                });
            }
        } catch (replyError) {
            console.error('Error sending error reply:', replyError);
        }
    }
}

async function handleButton(interaction) {
    try {
        console.log(`Button clicked: ${interaction.customId}`);
        
        switch (interaction.customId) {
            case 'view-cart':
                await showCart(interaction);
                break;
            case 'place-order':
                console.log('Place order button clicked - calling placeOrder function');
                await placeOrder(interaction);
                break;
            case 'shop-now':
                await createShoppingTicket(interaction);
                break;
            case 'ticket-shop':
                await showShopInTicket(interaction);
                break;
            case 'close-ticket':
                await closeShoppingTicket(interaction);
                break;
            case 'shop-prev':
                await showShopPage(interaction, -1);
                break;
            case 'shop-next':
                await showShopPage(interaction, 1);
                break;
            default:
                if (interaction.customId.startsWith('process-')) {
                    await updateOrderStatus(interaction, 'Processing');
                } else if (interaction.customId.startsWith('ready-')) {
                    await updateOrderStatus(interaction, 'Ready');
                } else if (interaction.customId.startsWith('complete-')) {
                    await updateOrderStatus(interaction, 'Completed');
                } else if (interaction.customId.startsWith('cancel-')) {
                    await cancelOrder(interaction);
                } else {
                    console.log(`Unknown button: ${interaction.customId}`);
                }
                break;
        }
    } catch (error) {
        console.error(`Error handling button ${interaction.customId}:`, error);
        
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: 'There was an error processing your request.', 
                    flags: 64
                });
            }
        } catch (replyError) {
            console.error('Error sending error reply:', replyError);
        }
    }
}

async function addItem(interaction) {
    const name = interaction.options.getString('name');
    const price = interaction.options.getNumber('price');
    const unit = interaction.options.getString('unit');
    
    const itemKey = name.toLowerCase().replace(/\s+/g, '-');
    
    farmItems.set(itemKey, {
        name: name,
        price: price,
        unit: unit
    });
    
    const embed = new EmbedBuilder()
        .setTitle('✅ Item Added!')
        .setDescription(`**${name}** has been added to the farm inventory.`)
        .addFields(
            { name: 'Price', value: `$${price.toFixed(2)} per ${unit}`, inline: true }
        )
        .setColor('#00FF00');
    
    await interaction.reply({ embeds: [embed] });
}

async function removeItem(interaction) {
    const name = interaction.options.getString('name');
    const itemKey = name.toLowerCase().replace(/\s+/g, '-');
    
    if (farmItems.has(itemKey)) {
        farmItems.delete(itemKey);
        
        const embed = new EmbedBuilder()
            .setTitle('🗑️ Item Removed')
            .setDescription(`**${name}** has been removed from the farm inventory.`)
            .setColor('#FF0000');
        
        await interaction.reply({ embeds: [embed] });
    } else {
        await interaction.reply({ content: `Item "${name}" not found in inventory.`, flags: 64 });
    }
}

async function showShop(interaction) {
    if (farmItems.size === 0) {
        await interaction.reply({ content: 'No items available for purchase.', flags: 64 });
        return;
    }
    
    const embed = new EmbedBuilder()
        .setTitle('🛒 Farm Shop')
        .setDescription('Select items to add to your cart:')
        .setColor('#32CD32');
    
    const itemsArray = Array.from(farmItems.entries());
    const itemsPerPage = 25;
    const totalPages = Math.ceil(itemsArray.length / itemsPerPage);
    
    const currentPage = 0;
    const startIndex = currentPage * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, itemsArray.length);
    const currentItems = itemsArray.slice(startIndex, endIndex);
    
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('item-select')
        .setPlaceholder('Choose an item to add to cart')
        .setMinValues(1)
        .setMaxValues(1);
    
    currentItems.forEach(([key, item]) => {
        selectMenu.addOptions({
            label: item.name,
            value: key,
            description: `$${item.price.toFixed(2)} per ${item.unit}`
        });
    });
    
    const components = [new ActionRowBuilder().addComponents(selectMenu)];
    
    if (totalPages > 1) {
        const buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('shop-prev')
                .setLabel('◀ Previous')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === 0),
            new ButtonBuilder()
                .setCustomId('shop-next')
                .setLabel('Next ▶')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === totalPages - 1)
        );
        components.push(buttonRow);
        embed.setFooter({ text: `Page ${currentPage + 1} of ${totalPages}` });
    }
    
    await interaction.reply({ embeds: [embed], components: components });
}

async function handleSelectMenu(interaction) {
    if (interaction.customId === 'item-select') {
        const selectedItem = interaction.values[0];
        const item = farmItems.get(selectedItem);
        
        if (!item) {
            await interaction.reply({ content: 'Item not found!', flags: 64 });
            return;
        }
        
        const modal = new ModalBuilder()
            .setCustomId(`quantity-modal-${selectedItem}`)
            .setTitle(`Add ${item.name} to Cart`);
        
        const quantityInput = new TextInputBuilder()
            .setCustomId('quantity')
            .setLabel(`How many ${item.unit}s of ${item.name}?`)
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter quantity')
            .setRequired(true);
        
        const row = new ActionRowBuilder().addComponents(quantityInput);
        modal.addComponents(row);
        
        await interaction.showModal(modal);
    }
}

async function handleModal(interaction) {
    if (interaction.customId.startsWith('quantity-modal-')) {
        const itemKey = interaction.customId.replace('quantity-modal-', '');
        const quantity = parseFloat(interaction.fields.getTextInputValue('quantity'));
        
        if (isNaN(quantity) || quantity <= 0) {
            await interaction.reply({ content: 'Please enter a valid positive number for quantity.', flags: 64 });
            return;
        }
        
        const item = farmItems.get(itemKey);
        if (!item) {
            await interaction.reply({ content: 'Item not found!', flags: 64 });
            return;
        }
        
        const userId = interaction.user.id;
        if (!customerCarts.has(userId)) {
            customerCarts.set(userId, []);
        }
        
        const cart = customerCarts.get(userId);
        const subtotal = item.price * quantity;
        
        cart.push({
            name: item.name,
            price: item.price,
            unit: item.unit,
            quantity: quantity,
            subtotal: subtotal
        });
        
        // Create or update the cart message
        await createOrUpdateCartMessage(interaction, item, quantity, subtotal);
    }
}

async function createOrUpdateCartMessage(interaction, addedItem, quantity, subtotal) {
    const userId = interaction.user.id;
    const cart = customerCarts.get(userId) || [];
    
    // Calculate total
    let total = 0;
    cart.forEach(item => {
        total += item.subtotal;
    });
    
    // Create the cart embed
    const cartEmbed = new EmbedBuilder()
        .setTitle('🛒 Your Current Cart')
        .setColor('#32CD32')
        .setFooter({ text: 'Use the buttons below to continue shopping or place your order' })
        .setTimestamp();
    
    if (cart.length === 0) {
        cartEmbed.setDescription('Your cart is empty!');
    } else {
        let description = '';
        cart.forEach((item, index) => {
            description += `**${index + 1}.** ${item.quantity} ${item.unit}${item.quantity !== 1 ? 's' : ''} of ${item.name} - $${item.subtotal.toFixed(2)}\n`;
        });
        
        cartEmbed.setDescription(description);
        cartEmbed.addFields({ name: '💰 Total', value: `$${total.toFixed(2)}`, inline: false });
    }
    
    // Add notification about the latest item added
    if (addedItem) {
        cartEmbed.addFields({
            name: '✅ Just Added',
            value: `${quantity} ${addedItem.unit}${quantity !== 1 ? 's' : ''} of ${addedItem.name} - $${subtotal.toFixed(2)}`,
            inline: false
        });
    }
    
    const cartButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('view-cart')
            .setLabel('Refresh Cart')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('place-order')
            .setLabel('Place Order')
            .setStyle(ButtonStyle.Success)
            .setDisabled(cart.length === 0)
    );
    
    try {
        // Check if we have an existing cart message for this user
        const existingCartMessage = cartMessages.get(userId);
        
        if (existingCartMessage) {
            // Try to update the existing message
            try {
                await existingCartMessage.edit({ 
                    embeds: [cartEmbed], 
                    components: [cartButtons] 
                });
                
                // Just dismiss the modal without any reply message
                await interaction.deferUpdate();
                
                return;
            } catch (error) {
                console.log('Could not update existing cart message, creating new one:', error.message);
                // Remove the invalid message reference
                cartMessages.delete(userId);
            }
        }
        
        // Create a new cart message
        const cartMessage = await interaction.reply({ 
            embeds: [cartEmbed], 
            components: [cartButtons],
            fetchReply: true
        });
        
        // Store the message reference
        cartMessages.set(userId, cartMessage);
        
    } catch (error) {
        console.error('Error creating/updating cart message:', error);
        await interaction.reply({ 
            content: 'There was an error updating your cart. Please try again.', 
            flags: 64 
        });
    }
}

async function showShopPage(interaction, direction) {
    const currentFooter = interaction.message.embeds[0]?.footer?.text || 'Page 1 of 1';
    const currentPage = parseInt(currentFooter.split(' ')[1]) - 1;
    const newPage = Math.max(0, currentPage + direction);
    
    const itemsArray = Array.from(farmItems.entries());
    const itemsPerPage = 25;
    const totalPages = Math.ceil(itemsArray.length / itemsPerPage);
    const clampedPage = Math.min(newPage, totalPages - 1);
    
    const startIndex = clampedPage * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, itemsArray.length);
    const currentItems = itemsArray.slice(startIndex, endIndex);
    
    const embed = new EmbedBuilder()
        .setTitle('🛒 Farm Shop')
        .setDescription('Select items to add to your cart:')
        .setColor('#32CD32')
        .setFooter({ text: `Page ${clampedPage + 1} of ${totalPages}` });
    
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('item-select')
        .setPlaceholder('Choose an item to add to cart')
        .setMinValues(1)
        .setMaxValues(1);
    
    currentItems.forEach(([key, item]) => {
        selectMenu.addOptions({
            label: item.name,
            value: key,
            description: `$${item.price.toFixed(2)} per ${item.unit}`
        });
    });
    
    const components = [new ActionRowBuilder().addComponents(selectMenu)];
    
    if (totalPages > 1) {
        const buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('shop-prev')
                .setLabel('◀ Previous')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(clampedPage === 0),
            new ButtonBuilder()
                .setCustomId('shop-next')
                .setLabel('Next ▶')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(clampedPage === totalPages - 1)
        );
        components.push(buttonRow);
    }
    
    await interaction.update({ embeds: [embed], components: components });
}

async function showCart(interaction) {
    const userId = interaction.user.id;
    const cart = customerCarts.get(userId) || [];
    
    if (cart.length === 0) {
        await interaction.reply({ content: 'Your cart is empty!', flags: 64 });
        return;
    }
    
    const embed = new EmbedBuilder()
        .setTitle('🛒 Your Cart')
        .setColor('#32CD32');
    
    let total = 0;
    let description = '';
    
    cart.forEach((item, index) => {
        description += `**${index + 1}.** ${item.quantity} ${item.unit}${item.quantity !== 1 ? 's' : ''} of ${item.name} - $${item.subtotal.toFixed(2)}\n`;
        total += item.subtotal;
    });
    
    embed.setDescription(description);
    embed.addFields({ name: 'Total', value: `$${total.toFixed(2)}`, inline: false });
    
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('place-order')
            .setLabel('Place Order')
            .setStyle(ButtonStyle.Success)
    );
    
    // Update the stored cart message if this is a view-cart button click
    if (interaction.isButton() && interaction.customId === 'view-cart') {
        try {
            await interaction.update({ embeds: [embed], components: [row] });
            const updatedMessage = await interaction.fetchReply();
            cartMessages.set(userId, updatedMessage);
        } catch (error) {
            console.error('Error updating cart view:', error);
            await interaction.reply({ embeds: [embed], components: [row] });
        }
    } else {
        await interaction.reply({ embeds: [embed], components: [row] });
    }
}

async function placeOrder(interaction) {
    const userId = interaction.user.id;
    const cart = customerCarts.get(userId) || [];
    
    console.log('=== PLACE ORDER DEBUG ===');
    console.log('User ID:', userId);
    console.log('Cart items:', cart.length);
    console.log('Channel ID:', interaction.channel.id);
    console.log('Channel name:', interaction.channel.name);
    
    if (cart.length === 0) {
        await interaction.reply({ content: 'Your cart is empty!', flags: 64 });
        return;
    }
    
    const orderId = 'ORDER-' + Date.now().toString().slice(-6);
    let total = 0;
    let orderSummary = '';
    
    cart.forEach((item, index) => {
        orderSummary += `${index + 1}. ${item.quantity} ${item.unit}${item.quantity !== 1 ? 's' : ''} of ${item.name} - $${item.subtotal.toFixed(2)}\n`;
        total += item.subtotal;
    });
    
    console.log('Order ID:', orderId);
    console.log('Total:', total);
    
    const customerEmbed = new EmbedBuilder()
        .setTitle('🧾 Order Placed Successfully!')
        .setDescription(`**Order ID:** ${orderId}\n\n**Order Summary:**\n${orderSummary}`)
        .addFields(
            { name: 'Total Amount', value: `$${total.toFixed(2)}`, inline: false },
            { name: '📋 Next Steps', value: 'Employees can manage this order using the buttons below!', inline: false }
        )
        .setColor('#FFD700')
        .setTimestamp();

    await interaction.reply({ embeds: [customerEmbed] });

    const isInTicket = interaction.channel.name && interaction.channel.name.startsWith('order-') && interaction.channel.id !== PLACE_ORDER_CHANNEL_ID;
    console.log('Is in ticket:', isInTicket);
    
    if (isInTicket) {
        console.log('✅ Creating order management interface in ticket...');
        
        const orderManagementEmbed = new EmbedBuilder()
            .setTitle(`🆕 New Order: ${orderId}`)
            .setDescription(`**Customer:** ${interaction.user.displayName} (${interaction.user.username})\n**Status:** Pending`)
            .addFields(
                { name: 'Items Ordered', value: orderSummary, inline: false },
                { name: 'Total Amount', value: `$${total.toFixed(2)}`, inline: true },
                { name: 'Order Time', value: new Date().toLocaleString(), inline: true }
            )
            .setColor('#FFD700')
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp();

        const orderManagementButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`process-${orderId}`)
                .setLabel('Mark Processing')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`ready-${orderId}`)
                .setLabel('Mark Ready')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`complete-${orderId}`)
                .setLabel('Complete')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`cancel-${orderId}`)
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Danger)
        );

        try {
            await interaction.followUp({ 
                embeds: [orderManagementEmbed],
                components: [orderManagementButtons]
            });
            console.log('✅ Order management interface sent to ticket successfully');
        } catch (error) {
            console.error('❌ Error sending order management to ticket:', error);
        }
    } else {
        console.log('❌ Not in a ticket - order placed in wrong channel');
    }
    
    // Clear cart and cart message reference
    customerCarts.delete(userId);
    cartMessages.delete(userId);
    console.log('✅ Cart cleared for user - order process complete');
}

async function setupShopWelcome(interaction) {
    try {
        console.log('Setup shop command started');
        
        await interaction.deferReply({ flags: 64 });
        
        const placeOrderChannel = findOrdersChannel(interaction.guild);
        console.log('Place order channel found:', !!placeOrderChannel);
        console.log('Channel name:', placeOrderChannel?.name);
        console.log('Channel ID:', placeOrderChannel?.id);
        
        if (!placeOrderChannel) {
            await interaction.editReply({ content: 'Could not find a suitable channel for orders! Please make sure you have a channel with "order" in the name.' });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('🚜 Welcome to Haven Farm Store!')
            .setDescription('Ready to shop for fresh farm products? Click the button below to start your private shopping session.')
            .setColor('#32CD32')
            .addFields(
                { name: '🛒 How it works:', value: '• Click "Shop Now" to create your private shopping ticket\n• Browse and add items to your cart in your ticket\n• Place your order when ready\n• Our employees will assist you promptly', inline: false },
                { name: '🌟 What we offer:', value: '• Fresh farm produce\n• Quality meats and dairy\n• Organic items\n• Competitive prices', inline: false }
            )
            .setFooter({ text: 'Haven Farm Store - Fresh from farm to table' })
            .setTimestamp();

        const shopButton = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('shop-now')
                .setLabel('🛒 Shop Now')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🛒')
        );

        console.log('Sending welcome message to channel...');
        await placeOrderChannel.send({ embeds: [embed], components: [shopButton] });
        
        console.log('Welcome message sent successfully');
        await interaction.editReply({ content: `✅ Shop welcome message posted to ${placeOrderChannel}!` });

    } catch (error) {
        console.error('Error in setupShopWelcome:', error);
        try {
            await interaction.editReply({ content: 'Error setting up shop welcome message. Check console for details.' });
        } catch (replyError) {
            console.error('Error sending error reply:', replyError);
        }
    }
}

async function createShoppingTicket(interaction) {
    try {
        const guild = interaction.guild;
        const customer = interaction.user;
        
        console.log(`Creating shopping ticket for ${customer.username}`);
        
        const existingChannel = guild.channels.cache.find(channel => 
            channel.name === `order-${customer.username.toLowerCase()}` && 
            channel.type === 0
        );

        if (existingChannel) {
            await interaction.reply({ 
                content: `You already have an open order ticket in ${existingChannel}!`,
                flags: 64
            });
            return;
        }

        const ticketChannel = await guild.channels.create({
            name: `order-${customer.username.toLowerCase()}`,
            type: 0,
            parent: OPENED_ORDERS_CATEGORY_ID,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: ['ViewChannel'],
                },
                {
                    id: customer.id,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
                },
                {
                    id: EMPLOYEE_ROLE_ID,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageMessages'],
                }
            ],
        });

        const welcomeEmbed = new EmbedBuilder()
            .setTitle(`🛒 Order Ticket for ${customer.displayName}`)
            .setDescription('Welcome to your private order ticket! Browse our farm products and add them to your cart.')
            .setColor('#32CD32')
            .addFields(
                { name: '🌟 Available Actions:', value: '• Use the shop menu below to browse items\n• Add items to your cart\n• View your cart anytime\n• Place your order when ready', inline: false },
                { name: '👥 Employee Support:', value: 'Our employees can see this ticket and will assist you when you place an order.', inline: false }
            )
            .setTimestamp();

        const shopControls = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket-shop')
                .setLabel('🛒 Browse Items')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('view-cart')
                .setLabel('👀 View Cart')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('close-ticket')
                .setLabel('🚪 Close Order Ticket')
                .setStyle(ButtonStyle.Danger)
        );

        await ticketChannel.send({ 
            content: `${customer}, welcome to your order ticket!`,
            embeds: [welcomeEmbed], 
            components: [shopControls] 
        });

        // Just acknowledge the interaction without a visible message
        await interaction.deferUpdate();

        console.log(`Order ticket created for ${customer.username} (${customer.id}): ${ticketChannel.name}`);

    } catch (error) {
        console.error('Error creating shopping ticket:', error);
        await interaction.reply({ 
            content: 'Sorry, there was an error creating your order ticket. Please try again or contact staff.',
            flags: 64
        });
    }
}

async function showShopInTicket(interaction) {
    await showShop(interaction);
}

async function closeShoppingTicket(interaction) {
    try {
        const channel = interaction.channel;
        const customer = interaction.user;
        
        if (!channel.name.startsWith('order-')) {
            await interaction.reply({ content: 'This command can only be used in order tickets.', flags: 64 });
            return;
        }

        // Clear cart and cart message reference
        customerCarts.delete(customer.id);
        cartMessages.delete(customer.id);

        const confirmEmbed = new EmbedBuilder()
            .setTitle('🚪 Closing Order Ticket')
            .setDescription('Your order ticket will be closed in 10 seconds. Thank you for visiting Haven Farm Store!')
            .setColor('#FF6B6B')
            .setTimestamp();

        await interaction.reply({ embeds: [confirmEmbed] });

        setTimeout(async () => {
            try {
                await channel.delete('Order ticket closed by customer');
            } catch (error) {
                console.error('Error deleting order ticket:', error);
            }
        }, 10000);

    } catch (error) {
        console.error('Error closing shopping ticket:', error);
        await interaction.reply({ content: 'Error closing shopping session.', flags: 64 });
    }
}

async function updateOrderStatus(interaction, newStatus) {
    const orderId = interaction.customId.split('-')[1];
    
    const embed = interaction.message.embeds[0];
    const newEmbed = new EmbedBuilder()
        .setTitle(embed.title)
        .setDescription(embed.description.replace(/\*\*Status:\*\* \w+/, `**Status:** ${newStatus}`))
        .setColor(getStatusColor(newStatus))
        .setThumbnail(embed.thumbnail?.url)
        .setTimestamp();
    
    embed.fields.forEach(field => {
        newEmbed.addFields({ name: field.name, value: field.value, inline: field.inline });
    });
    
    if (newStatus === 'Completed') {
        await interaction.update({ embeds: [newEmbed], components: [] });
        
        await archiveCompletedOrder(interaction, orderId, newEmbed);
        
        await interaction.followUp({ 
            content: `✅ Order ${orderId} completed and moved to Archived Orders!`, 
            flags: 64
        });
    } else {
        await interaction.update({ embeds: [newEmbed], components: interaction.message.components });
        
        // If order is marked as "Ready", notify the customer
        if (newStatus === 'Ready') {
            // Extract customer info from the embed description
            const description = embed.description;
            const customerMatch = description.match(/\*\*Customer:\*\* (.+?) \((.+?)\)/);
            
            if (customerMatch) {
                const customerDisplayName = customerMatch[1];
                const customerUsername = customerMatch[2];
                
                // Find the customer in the guild
                const guild = interaction.guild;
                const customer = guild.members.cache.find(member => 
                    member.user.username === customerUsername || 
                    member.displayName === customerDisplayName
                );
                
                if (customer) {
                    // Create notification embed
                    const notificationEmbed = new EmbedBuilder()
                        .setTitle('🟢 Your Order is Ready!')
                        .setDescription(`**Order ID:** ${orderId}\n\nYour order has been prepared and is ready for pickup!`)
                        .addFields(
                            { name: '📍 Next Steps', value: 'Please come to the pickup location to collect your order.', inline: false },
                            { name: '⏰ Processed By', value: interaction.user.displayName, inline: true }
                        )
                        .setColor('#00FF00')
                        .setTimestamp();
                    
                    // Send notification in the ticket channel
                    await interaction.followUp({
                        content: `${customer} 🔔 **Your order is ready for pickup!**`,
                        embeds: [notificationEmbed]
                    });
                } else {
                    console.log(`Could not find customer: ${customerUsername}`);
                    await interaction.followUp({ 
                        content: `✅ Order ${orderId} status updated to: **${newStatus}** (Could not notify customer - user not found)`, 
                        flags: 64
                    });
                }
            } else {
                console.log('Could not extract customer info from embed');
                await interaction.followUp({ 
                    content: `✅ Order ${orderId} status updated to: **${newStatus}** (Could not notify customer - info not found)`, 
                    flags: 64
                });
            }
        } else {
            await interaction.followUp({ 
                content: `✅ Order ${orderId} status updated to: **${newStatus}**`, 
                flags: 64
            });
        }
    }
}

async function cancelOrder(interaction) {
    const orderId = interaction.customId.split('-')[1];
    
    const embed = interaction.message.embeds[0];
    const newEmbed = new EmbedBuilder()
        .setTitle(embed.title + ' [CANCELLED]')
        .setDescription(embed.description.replace(/\*\*Status:\*\* \w+/, `**Status:** Cancelled`))
        .setColor('#FF0000')
        .setThumbnail(embed.thumbnail?.url)
        .setTimestamp();
    
    embed.fields.forEach(field => {
        newEmbed.addFields({ name: field.name, value: field.value, inline: field.inline });
    });
    
    await interaction.update({ embeds: [newEmbed], components: [] });
    
    await interaction.followUp({ 
        content: `❌ Order ${orderId} has been cancelled.`, 
        flags: 64
    });
}

async function archiveCompletedOrder(interaction, orderId, orderEmbed) {
    try {
        const guild = interaction.guild;
        const orderChannel = interaction.channel;

        if (orderChannel && orderChannel.name.startsWith('order-')) {
            console.log(`Moving ticket ${orderChannel.name} to Archived Orders category`);
            
            await orderChannel.setParent(ARCHIVED_ORDERS_CATEGORY_ID);
            
            const newName = `archived-${orderChannel.name.replace('order-', '')}`;
            await orderChannel.setName(newName);
            
            const archiveNotification = new EmbedBuilder()
                .setTitle('📁 Order Archived')
                .setDescription(`Order ${orderId} has been completed and this ticket has been moved to Archived Orders.`)
                .addFields(
                    { name: '✅ Completed By', value: interaction.user.displayName, inline: true },
                    { name: '📅 Completion Date', value: new Date().toLocaleString(), inline: true }
                )
                .setColor('#800080')
                .setTimestamp();

            await orderChannel.send({ embeds: [archiveNotification] });
            
            console.log(`Order ${orderId} ticket archived successfully`);
        } else {
            console.log(`Could not find ticket channel for order ${orderId}`);
        }
        
    } catch (error) {
        console.error('Error archiving order:', error);
    }
}

function getStatusColor(status) {
    switch (status.toLowerCase()) {
        case 'pending': return '#FFA500';
        case 'processing': return '#0099FF';
        case 'ready': return '#00FF00';
        case 'completed': return '#800080';
        case 'cancelled': return '#FF0000';
        default: return '#FFD700';
    }
}

client.login(process.env.DISCORD_TOKEN);